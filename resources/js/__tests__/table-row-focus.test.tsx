// @vitest-environment happy-dom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Table, TableBody, TableCell, TableRow } from '@/components/table';

describe('TableRow keyboard focus', () => {
    it('draws an inset focus ring on clickable rows and leaves plain rows alone', () => {
        render(
            <Table>
                <TableBody>
                    <TableRow tabIndex={0} aria-label="Edit Hello">
                        <TableCell>Hello</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Plain</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );

        const [clickable, plain] = document.querySelectorAll('tr');
        expect(clickable?.className).toContain('focus-visible:outline-2');
        expect(clickable?.className).toContain('focus-visible:-outline-offset-2');
        expect(clickable?.className).toContain('focus-visible:outline-blue-500');
        expect(plain?.className).not.toContain('focus-visible:outline-2');
        expect(clickable?.className).not.toContain('even:bg-zinc-950/2.5');
    });
});
