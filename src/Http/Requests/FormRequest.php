<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Illuminate\Contracts\Validation\ValidatesWhenResolved;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidatesWhenResolvedTrait;
use Illuminate\Validation\Validator;
use ReflectionClass;

/**
 * Package-local FormRequest base class.
 *
 * This exists to avoid pulling in illuminate/foundation (the entire framework)
 * as a hard dependency. It is kept at full parity with
 * Illuminate\Foundation\Http\FormRequest and MUST be reviewed whenever Canvas
 * adds support for a new major Laravel version.
 *
 * PHP attribute support (#[ErrorBag], #[StopOnFirstFailure], #[RedirectTo],
 * #[RedirectToRoute], #[FailOnUnknownFields]) is implemented via class_exists
 * guards — the foundation attribute classes are always present at runtime in
 * any host Laravel application, but are not declared as a hard dependency here.
 */
abstract class FormRequest extends Request implements ValidatesWhenResolved
{
    use ValidatesWhenResolvedTrait;

    protected Container $container;

    protected Redirector $redirector;

    protected ?string $redirect = null;

    protected ?string $redirectRoute = null;

    protected ?string $redirectAction = null;

    protected string $errorBag = 'default';

    protected bool $stopOnFirstFailure = false;

    protected ?Validator $validator = null;

    protected static bool $globalFailOnUnknownFields = false;

    protected function getValidatorInstance(): Validator
    {
        if ($this->validator) {
            return $this->validator;
        }

        $this->configureFromAttributes();

        $factory = $this->container->make(ValidationFactory::class);

        if (method_exists($this, 'validator')) {
            /** @var Validator $validator */
            $validator = $this->container->call([$this, 'validator'], ['factory' => $factory]);
        } else {
            $validator = $this->createDefaultValidator($factory);
        }

        if (method_exists($this, 'withValidator')) {
            $this->withValidator($validator);
        }

        if (method_exists($this, 'after')) {
            $validator->after($this->container->call([$this, 'after'], ['validator' => $validator]));
        }

        if ($this->shouldFailOnUnknownFields()) {
            $validator->after(function (ValidatorContract $validator): void {
                $this->validateNoUnknownFields($validator);
            });
        }

        $this->setValidator($validator);

        return $this->validator;
    }

    protected function configureFromAttributes(): void
    {
        $reflection = new ReflectionClass($this);

        if (class_exists('Illuminate\Foundation\Http\Attributes\StopOnFirstFailure') &&
            $reflection->getAttributes('Illuminate\Foundation\Http\Attributes\StopOnFirstFailure') !== []) {
            $this->stopOnFirstFailure = true;
        }

        if (class_exists('Illuminate\Foundation\Http\Attributes\RedirectTo')) {
            $redirectTo = $reflection->getAttributes('Illuminate\Foundation\Http\Attributes\RedirectTo');
            if ($redirectTo !== []) {
                $this->redirect = $redirectTo[0]->newInstance()->url;
            }
        }

        if (class_exists('Illuminate\Foundation\Http\Attributes\RedirectToRoute')) {
            $redirectToRoute = $reflection->getAttributes('Illuminate\Foundation\Http\Attributes\RedirectToRoute');
            if ($redirectToRoute !== []) {
                $this->redirectRoute = $redirectToRoute[0]->newInstance()->route;
            }
        }

        if (class_exists('Illuminate\Foundation\Http\Attributes\ErrorBag')) {
            $errorBag = $reflection->getAttributes('Illuminate\Foundation\Http\Attributes\ErrorBag');
            if ($errorBag !== []) {
                $this->errorBag = $errorBag[0]->newInstance()->name;
            }
        }
    }

    protected function createDefaultValidator(ValidationFactory $factory): Validator
    {
        $rules = $this->validationRules();

        $validator = $factory->make(
            $this->validationData(),
            $rules,
            $this->messages(),
            $this->attributes(),
        );

        if (! $validator instanceof Validator) {
            throw new \RuntimeException('Expected Illuminate\\Validation\\Validator instance.');
        }

        $validator->stopOnFirstFailure($this->stopOnFirstFailure);

        if ($this->isPrecognitive()) {
            $validator->setRules(
                $this->filterPrecognitiveRules($validator->getRulesWithoutPlaceholders())
            );
        }

        return $validator;
    }

    /**
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        return $this->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function validationRules(): array
    {
        return method_exists($this, 'rules') ? $this->container->call([$this, 'rules']) : [];
    }

    protected function shouldFailOnUnknownFields(): bool
    {
        if (class_exists('Illuminate\Foundation\Http\Attributes\FailOnUnknownFields')) {
            $attributes = (new ReflectionClass($this))->getAttributes('Illuminate\Foundation\Http\Attributes\FailOnUnknownFields');

            if ($attributes !== []) {
                return $attributes[0]->newInstance()->value;
            }
        }

        return static::$globalFailOnUnknownFields;
    }

    protected function validateNoUnknownFields(ValidatorContract $validator): void
    {
        $allowedKeys = array_keys($this->validationRules());
        $input = $this->isJson() ? $this->json()->all() : $this->request->all();

        foreach (array_keys(Arr::dot($input)) as $inputKey) {
            if (! $this->isKnownField($inputKey, $allowedKeys)) {
                $validator->errors()->add($inputKey, trans('validation.prohibited', [
                    'attribute' => str_replace('_', ' ', $inputKey),
                ]));
            }
        }
    }

    /**
     * @param  list<string|int>  $allowedKeys
     */
    protected function isKnownField(string $inputKey, array $allowedKeys): bool
    {
        foreach ($allowedKeys as $ruleKey) {
            $ruleKey = (string) $ruleKey;

            if ($ruleKey === $inputKey) {
                return true;
            }

            if (str_ends_with($inputKey, '_confirmation') &&
                $ruleKey === substr($inputKey, 0, -13)) {
                return true;
            }

            if (str_contains($ruleKey, '*')) {
                $pattern = '/^'.str_replace('\*', '[^.]+', preg_quote($ruleKey, '/')).'$/';

                if (preg_match($pattern, $inputKey)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [];
    }

    /**
     * @param  list<string>|null  $keys
     */
    public function safe(?array $keys = null): mixed
    {
        return is_array($keys)
            ? $this->validator->safe()->only($keys)
            : $this->validator->safe();
    }

    public function validated(mixed $key = null, mixed $default = null): mixed
    {
        return data_get($this->validator->validated(), $key, $default);
    }

    protected function passesAuthorization(): bool
    {
        if (! method_exists($this, 'authorize')) {
            return true;
        }

        $result = $this->container->call([$this, 'authorize']);

        return $result instanceof Response ? $result->authorize() : (bool) $result;
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        if (! $validator instanceof Validator) {
            throw new \RuntimeException('Expected Illuminate\\Validation\\Validator instance.');
        }

        $exception = $validator->getException();

        throw (new $exception($validator))
            ->errorBag($this->errorBag)
            ->redirectTo($this->getRedirectUrl());
    }

    protected function getRedirectUrl(): string
    {
        $url = $this->redirector->getUrlGenerator();

        return match (true) {
            ! empty($this->redirect) => $url->to($this->redirect),
            ! empty($this->redirectRoute) => $url->route($this->redirectRoute),
            ! empty($this->redirectAction) => $url->action($this->redirectAction),
            default => $url->previous(),
        };
    }

    protected function failedAuthorization(): void
    {
        throw new AuthorizationException;
    }

    public static function failOnUnknownFields(bool $value = true): void
    {
        static::$globalFailOnUnknownFields = $value;
    }

    public function setValidator(ValidatorContract $validator): static
    {
        /** @var Validator $validator */
        $this->validator = $validator;

        return $this;
    }

    public function setRedirector(Redirector $redirector): static
    {
        $this->redirector = $redirector;

        return $this;
    }

    public function setContainer(Container $container): static
    {
        $this->container = $container;

        return $this;
    }

    public static function flushState(): void
    {
        static::$globalFailOnUnknownFields = false;
    }

    protected function prepareForValidation(): void {}

    protected function passedValidation(): void {}
}
