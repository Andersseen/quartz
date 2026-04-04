import { render, screen } from '@testing-library/angular';
import { App } from './app.component';

describe('App', () => {
  it('should create the app', async () => {
    const { fixture } = await render(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the router-outlet', async () => {
    await render(App);
    // Testing Library approach: check for elements in the DOM
    const outlet = document.querySelector('router-outlet');
    expect(outlet).toBeInTheDocument();
  });
});
