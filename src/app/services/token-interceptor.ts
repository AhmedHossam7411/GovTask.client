import { HttpEvent, HttpEventType, HttpHandler, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from './auth-service';
import { inject, Injectable } from '@angular/core';

export function tokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  { 
    const auth = inject(Auth);
  console.log("here", localStorage.getItem('authToken'));
  const token = auth.getToken();
  if(token){
    const tokenizedReq = req.clone({
      setHeaders: {
        Authorization : `Bearer ${token}`
      }
    });
    console.log(tokenizedReq.headers);
    return next(tokenizedReq);
  }
  return next(req); 
}
}