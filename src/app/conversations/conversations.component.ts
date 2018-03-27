import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { MessagingService } from '../messaging.service';
import { DataService } from '../data.service';
import { CreateConversationDialogComponent } from '../create-conversation-dialog/create-conversation-dialog.component';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/map';

declare var webkitSpeechRecognition: any;
declare var speechSynthesis: any;
declare var SpeechSynthesisUtterance: any;

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.css']
})
export class ConversationsComponent implements OnInit {

  constructor(private ms: MessagingService, private ds: DataService, private router: Router, public dialog: MatDialog) { }

  buildConversationsArray(conversations) {
    let array = [];

    for (let conversation in conversations) {
      array.push(conversations[conversation]);
    }

    return array
  }

  ngOnInit() {
    if (!this.ds.app) {
      this.router.navigate(['/']);
    } else {
      this.ds.app.getConversations().then(conversations => {
        this.userConversations = conversations;
        this.conversations = this.buildConversationsArray(conversations)
        this.allConversations = []
        this.ms.getConversations().then(conversations => {
          for (let i = 0; i < conversations.length; i++) {
            this.ms.getConversation(conversations[i].uuid).then(
              (conversation) => {
                if (!this.userConversations[conversation.uuid]) {
                  this.allConversations.push(conversation)
                }
              }
            )

          }
        })
      })
      this.ms.getUsers().then(users => this.users = users)

    }
  }

  selectConversation(conversationId: string) {
    this.ds.app.getConversation(conversationId).then(conversation => {
      this.selectedConversation = conversation
      Observable.from(conversation.events.values()).subscribe(
        event => {
          //this.events.push(event)
        }
      )

      this.selectedConversation.on("text", (sender, message) => {
        this.events.push(message)
        document.querySelector(".conversation-history").scrollTop = document.querySelector(".conversation-history").scrollHeight + 150;
      })
      console.log("Selected Conversation", this.selectedConversation)
    }
    )
  }

  createConversation(): void {
    let dialogRef = this.dialog.open(CreateConversationDialogComponent, {
      width: '300px',
      data: this.ds.app.me
    });


    dialogRef.afterClosed().subscribe(result => {
      console.log("dialog closed")
      this.ds.app.getConversations().then((conversations) => {
        this.conversations = this.buildConversationsArray(conversations)
      })
    });
  }


  sendText(text: string, media: boolean) {
    this.selectedConversation.sendText(text).then(
      () => {
        this.ds.sendToBot(text).then(response => {
          this.events.push({
            type: "text",
            body: {
              text: response.result.fulfillment.speech
            },
            from: "MEM-3b7538b6-a652-4a3b-8633-84db5c38423a"
          })
          if (media) {
            let utterance = new SpeechSynthesisUtterance();

            utterance.text = response.result.fulfillment.speech
            utterance.rate = 5;
            utterance.pitch = 2;
            utterance.lang = "en-GB";

            speechSynthesis.speak(utterance)
          }
        })
        this.text = ""
      }
    )
  }

  toggleVoice() {
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.lang = "en-US";
    this.recognition.interimResults = false;
    this.recognition.start();

    this.recognition.addEventListener('result', (e) => {
      let last = e.results.length - 1
      let text = e.results[last][0].transcript
      this.sendText(text, true)
      this.recognition.stop()
      this.recognition = null
      
    });
  }



  private nameToImage(name) {
    var hash = this.hashStr(name);
    var index = hash % 200;
    if (index < 100) {
      return {
        prefix: "",
        index: index
      }
    } else {
      return {
        prefix: "wo",
        index: index - 100
      }
    }
  }

  private hashStr(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var charCode = str.charCodeAt(i);
      hash += charCode;
    }
    return hash;
  }

  conversations: any
  allConversations: any
  userConversations: any
  users: any
  selectedConversation: any
  text: string
  events: Array<any> = []
  recognition: any
}
