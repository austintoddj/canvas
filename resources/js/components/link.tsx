/**
 * React Router integration for Catalyst's Link component.
 * See: https://catalyst.tailwindui.com/docs#client-side-router-integration
 */

import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import React, { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export const Link = forwardRef(function Link(
    { className, ...props }: { href: string; className?: string } & React.ComponentPropsWithoutRef<'a'>,
    ref: React.ForwardedRef<HTMLAnchorElement>
) {
    return (
        <Headless.DataInteractive>
            <RouterLink {...props} to={props.href} ref={ref} className={clsx('cursor-pointer', className)} />
        </Headless.DataInteractive>
    );
});
