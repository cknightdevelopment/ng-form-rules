import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";

@Injectable()
export class UserService {
    private existingUsernames = ['chris', 'jerry'];

    doesUsernameAlreadyExist(username: string): boolean {
        return this.existingUsernames.includes(username);
    }

    doesUsernameAlreadyExistAsync(username: string): Observable<boolean> {
        return of(this.doesUsernameAlreadyExist(username))
            .pipe(delay(2000));
    }
}