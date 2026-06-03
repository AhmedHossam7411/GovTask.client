import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './app/services/token-interceptor';

// Router is provided once, in app.config.ts. main.ts only adds HttpClient so the
// router is not configured twice (duplicate provideRouter caused flaky guards).
bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideHttpClient(
      withInterceptors([tokenInterceptor]),
    ),
  ]
});