import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src';

function renderTabs() {
  return render(
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account settings</TabsContent>
      <TabsContent value="billing">Billing settings</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('shows the default tab content and hides the others', () => {
    renderTabs();
    expect(screen.getByText('Account settings')).toBeVisible();
    expect(screen.queryByText('Billing settings')).not.toBeInTheDocument();
  });

  it('switches content when a different trigger is clicked', async () => {
    renderTabs();
    await userEvent.click(screen.getByRole('tab', { name: 'Billing' }));

    expect(screen.getByText('Billing settings')).toBeVisible();
    expect(screen.queryByText('Account settings')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true');
  });
});
