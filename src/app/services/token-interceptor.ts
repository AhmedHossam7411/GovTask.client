import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, skip, switchMap, throwError } from 'rxjs';
import { Auth } from './auth-service';

export function tokenInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {

  const auth = inject(Auth);
  const token = auth.getToken();
  let refreshInProgress = false;
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });
  }

  return next(authReq).pipe(

    catchError(error => {

  console.log("Interceptor caught error:", error, req.url);

  if (error.status === 401 &&
      !req.url.toLowerCase().includes('/auth/refresh') && !refreshInProgress ) {

    console.log("401 detected, attempting refresh");

    return auth.refresh().pipe(
      switchMap(res => {
        console.log("Refresh success");
        refreshInProgress = true;
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${res.accessToken}`,
            'ngrok-skip-browser-warning': '6024'
          }
        });
        return next(retryReq);
      }),
      catchError(refreshError => {
        console.log("Refresh failed → logout");
        refreshInProgress = false;
        return auth.logout().pipe(
          switchMap(() => throwError(() => refreshError))
        );
      })
    );
  }

  return throwError(() => error);
})
  );
}

