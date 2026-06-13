<?php

namespace Canvas\Http\Requests;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Illuminate\Contracts\Validation\ValidatesWhenResolved;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Validation\ValidatesWhenResolvedTrait;

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

    protected ?ValidatorContract $validator = null;

    protected function getValidatorInstance(): ValidatorContract
    {
        if ($this->validator) {
            return $this->validator;
        }

        $factory = $this->container->make(ValidationFactory::class);
        $validator = $factory->make(
            $this->validationData(),
            $this->validationRules(),
            $this->messages(),
            $this->attributes(),
        )->stopOnFirstFailure($this->stopOnFirstFailure);

        $this->setValidator($validator);

        return $this->validator;
    }

    public function validationData(): array
    {
        return $this->all();
    }

    protected function validationRules(): array
    {
        return method_exists($this, 'rules') ? $this->container->call([$this, 'rules']) : [];
    }

    public function messages(): array
    {
        return [];
    }

    public function attributes(): array
    {
        return [];
    }

    public function validated($key = null, $default = null): mixed
    {
        return data_get($this->validator?->validated() ?? [], $key, $default);
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

    public function setValidator(ValidatorContract $validator): static
    {
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

    protected function prepareForValidation(): void
    {
        //
    }

    protected function passedValidation(): void
    {
        //
    }

    public static function failOnUnknownFields(bool $value = true): void
    {
        // intentionally unsupported in the package-local request base
    }
}
