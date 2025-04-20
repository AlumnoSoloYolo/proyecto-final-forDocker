
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';



interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
        avatar: string
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    public currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser = this.currentUserSubject.asObservable();


    private apiUrl = environment.apiUrl + '/auth';

    constructor(private http: HttpClient) {

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            this.currentUserSubject.next(JSON.parse(storedUser));
        }
    }


    register(
        username: string,
        email: string,
        password: string,
        avatar: string = 'avatar1'
    ): Observable<AuthResponse> {

        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
            username,
            email,
            password,
            avatar
        }).pipe(
            tap(response => {
                // console.log('Respuesta de registro:', response);
                this.saveAuth(response);
            }),
            catchError(error => {
                // console.error('Error completo en registro:', error);
                return throwError(() => error);
            })
        );
    }

    login(email: string, password: string): Observable<AuthResponse> {

        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
            email,
            password
        }).pipe(
            tap(response => {
                this.saveAuth(response);
            }),
            catchError(error => {
                console.error('Error en login:', error);
                if (error.status === 401) {
                    return throwError(() => new Error('INVALID_CREDENTIALS'));
                } else if (error.status === 404) {
                    return throwError(() => new Error('USER_NOT_FOUND'));
                } else {
                    return throwError(() => new Error('SERVER_ERROR'));
                }
            })
        );
    }

    private saveAuth(response: any) {

        if (response && response.token) {
            localStorage.setItem('token', response.token);

            const userData = response.user;

            const userToStore = {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                avatar: userData.avatar || 'default-avatar'
            };

            localStorage.setItem('user', JSON.stringify(userToStore));

            this.currentUserSubject.next(userToStore);
        } else {
            console.error('Respuesta inválida en saveAuth:', response);
        }
    }


    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }


    getToken(): string | null {
        return localStorage.getItem('token');
    }


    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }



}