import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '../../src/components/Table/Table';

describe('Table', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <Table>
        <TableCaption>Test</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('tem role table', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>C</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});
