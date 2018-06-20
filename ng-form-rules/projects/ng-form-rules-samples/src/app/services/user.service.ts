import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { delay, tap, map } from "rxjs/operators";

@Injectable()
export class UserService {
    private existingUsernames = ['chris', 'jerry'];

    constructor(private http: HttpClient) {
    }

    callGitHub(name: string): Observable<Object> {
        return this.http.get<any>(`https://api.github.com/search/repositories?q=${name}`).pipe(map(x => !!x.items.length));
    }

    doesUsernameAlreadyExist(username: string): boolean {

        return this.existingUsernames.includes(username);
    }

    doesUsernameAlreadyExistAsync(username: string): Observable<boolean> {
        return of(this.doesUsernameAlreadyExist(username))
            .pipe(delay(2000));
    }
}