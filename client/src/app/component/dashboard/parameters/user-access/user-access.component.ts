import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-access',
  templateUrl: './user-access.component.html',
  styleUrls: ['./user-access.component.scss']
})
export class UserAccessComponent implements OnInit {

  public path = 'grid';
  public name = 'user_access';
  
  constructor() { }

  ngOnInit() {
  }

}
