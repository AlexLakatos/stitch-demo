import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class DataService {

  constructor(private http: HttpClient) { }

  public sendToBot(text: string): Promise<any> {
    return this.http.post("https://api.api.ai/v1/query?v=20150910", {
      query: text,
      lang: "en", sessionId: "somerandomthing"
    }, {
      headers: {
        "Authorization": "Bearer DIALOG_FLOW_CLIENT_KEY"
      }
    }).toPromise()
  }

  app: any
}
