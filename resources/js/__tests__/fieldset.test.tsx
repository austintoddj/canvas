// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Description, ErrorMessage, Field, FieldGroup, Label } from '@/components/fieldset';
import { Input } from '@/components/input';

describe('Field rhythm', () => {
    it('keeps a 20px group gap and a 6px gap from the label to the control', () => {
        render(
            <FieldGroup>
                <Field>
                    <Label>Name</Label>
                    <Input name="name" />
                    <ErrorMessage>Required</ErrorMessage>
                </Field>
                <Field>
                    <Label>Slug</Label>
                    <Description>Used in the URL.</Description>
                    <Input name="slug" />
                </Field>
            </FieldGroup>
        );

        const group = screen.getByText('Name').closest('.space-y-5');
        expect(group).not.toBeNull();
        expect(group?.className).not.toContain('space-y-8');

        const nameField = screen.getByText('Name').parentElement;
        expect(nameField?.className).toContain('[&>[data-slot=label]+[data-slot=control]]:mt-1.5');
        expect(nameField?.className).toContain('[&>[data-slot=control]+[data-slot=error]]:mt-3');

        const slugField = screen.getByText('Slug').parentElement;
        expect(slugField?.className).toContain('[&>[data-slot=description]+[data-slot=control]]:mt-1.5');
    });
});
