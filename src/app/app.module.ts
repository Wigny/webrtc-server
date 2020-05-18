import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { ReceptorComponent } from './receptor/receptor.component';
import { TransmissorComponent } from './transmissor/transmissor.component';

const config: SocketIoConfig = {
  url: 'https://172.31.4.42:5000',
  options: {},
};

const routes: Routes = [
  { path: '', component: AppComponent, },
  { path: 'receptor', component: ReceptorComponent, },
  { path: 'transmissor', component: TransmissorComponent, },
];

@NgModule({
  declarations: [
    AppComponent,
    ReceptorComponent,
    TransmissorComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    SocketIoModule.forRoot(config),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
