// @ts-expect-error: Missing @angular/ssr/node types in environment
import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
// @ts-expect-error: Missing express types in environment
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();




app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);


// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((req: any, res: any, next: any) => {
  angularApp
    .handle(req)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((response: any) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});


if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.listen(port, (error: any) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}


export const reqHandler = createNodeRequestHandler(app);
