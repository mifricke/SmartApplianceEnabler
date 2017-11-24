/*
Copyright (C) 2017 Axel Müller <axel.mueller@avanux.de>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import {Injectable} from '@angular/core';
import {ApplianceInfo} from './appliance-info';
import {Schedule} from './schedule';
import {Settings} from './settings';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {ScheduleFactory} from './schedule-factory';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {ApplianceFactory} from './appliance-factory';
import {Control} from './control';
import {ControlFactory} from './control-factory';
import {Meter} from './meter';
import {MeterFactory} from './meter-factory';
import {SettingsFactory} from './settings-factory';
import {AppliancesReloadService} from './appliances-reload-service';
import {observable} from 'rxjs/symbol/observable';
import {Subject} from 'rxjs/Subject';
import {ApplianceHeader} from './appliance-header';
import {MeterDefaults} from '../appliance-meter/meter-defaults';
import {ControlDefaults} from '../appliance-control/control-defaults';
import {SettingsDefaults} from '../settings/settings-defaults';

@Injectable()
export class ApplianceService {
  // private api = 'http://localhost:8080/sae';
  private api = window.location.protocol + '//' + window.location.hostname + ':8080/sae';
  private headers: Headers = new Headers();

  constructor(private http: Http) {
    this.headers.append('Content-Type', 'application/json');
  }

  getApplianceHeaders(): Observable<Array<ApplianceHeader>> {
    return this.http.get(`${this.api}/appliances`)
      .map(response => response.json())
      .map(applianceHeaders => applianceHeaders.map(applianceHeader => ApplianceFactory.toApplianceHeaderFromJSON(applianceHeader)))
      .catch(this.errorHandler);
  }

  getApplianceInfo(id: string): Observable<ApplianceInfo> {
    return this.http.get(`${this.api}/appliance?id=${id}`)
      .map(response => response.json())
      .map(applianceInfo => ApplianceFactory.toApplianceInfoFromJSON(applianceInfo))
      .catch(this.errorHandler);
  }

  updateAppliance(appliance: ApplianceInfo, create: boolean): Observable<any> {
    const url = `${this.api}/appliance?id=${appliance.id}&create=${create}`;
    const content = ApplianceFactory.toJSONfromApplianceInfo(appliance);
    console.log('Updating applianceHeader using ' + url);
    console.log('Content: ' + content);
    const observer = new Subject();
    this.http.put(url, content, {headers: this.headers})
      .catch(this.errorHandler)
      .subscribe(res => {
        console.log(res);
        observer.next();
      });
    return observer;
  }

  deleteAppliance(id: string): Observable<any> {
    const url = `${this.api}/appliance?id=${id}`;
    console.log('Delete applianceHeader using ' + url);
    const observer = new Subject();
    this.http.delete(url, {headers: this.headers})
      .catch(this.errorHandler)
      .subscribe(res => {
        console.log(res);
        observer.next();
      });
    return observer;
  }

  getControlDefaults(): Observable<ControlDefaults> {
    return this.http.get(`${this.api}/controldefaults`)
      .map(response => {
        return ControlFactory.defaultsFromJSON(response.json());
      })
      .catch(this.errorHandler);
  }

  getControl(id: string): Observable<Control> {
    return this.http.get(`${this.api}/control?id=${id}`)
      .map(response => {
        if (response['_body'].length > 0) {
          return ControlFactory.fromJSON(response.json());
        }
        return ControlFactory.createEmptyControl();
      })
      .catch(this.errorHandler);
  }

  updateControl(control: Control, id: string): Observable<any> {
    const url = `${this.api}/control?id=${id}`;
    const content = ControlFactory.toJSON(control);
    console.log('Update control using ' + url);
    return this.httpPutOrDelete(url, content);
  }

  getMeterDefaults(): Observable<MeterDefaults> {
    return this.http.get(`${this.api}/meterdefaults`)
      .map(response => {
        return MeterFactory.defaultsFromJSON(response.json());
      })
      .catch(this.errorHandler);
  }

  getMeter(id: string): Observable<Meter> {
    return this.http.get(`${this.api}/meter?id=${id}`)
      .map(response => {
        if (response['_body'].length > 0) {
          return MeterFactory.fromJSON(response.json());
        }
        return MeterFactory.createEmptyMeter();
      })
      .catch(this.errorHandler);
  }

  updateMeter(meter: Meter, id: string): Observable<any> {
    const url = `${this.api}/meter?id=${id}`;
    const content = MeterFactory.toJSON(meter);
    console.log('Update meter using ' + url);
    return this.httpPutOrDelete(url, content);
  }

  httpPutOrDelete(url: string, content: string): Observable<any> {
    const observer = new Subject();
    console.log('Content: ' + content);
    if (content != null) {
      this.http.put(url, content, {headers: this.headers})
        .catch(this.errorHandler)
        .subscribe(res => {
          console.log(res);
          observer.next();
        });
    } else {
      this.http.delete(url, {headers: this.headers})
        .catch(this.errorHandler)
        .subscribe(res => {
          console.log(res);
          observer.next();
        });
    }
    return observer;
  }

  getSchedules(id: string): Observable<Array<Schedule>> {
    return this.http.get(`${this.api}/schedules?id=${id}`)
      .map(response => response.json())
      .map(rawSchedules => rawSchedules.map(rawSchedule => ScheduleFactory.toSchedule(rawSchedule)))
      .catch(this.errorHandler);
  }

  setSchedules(id: string, schedules: Schedule[]) { // : Observable<any> {
    const url = `${this.api}/schedules?id=${id}`;
    const content = ScheduleFactory.toJSON(schedules);
    console.log('Set schedule using ' + url);
    console.log('Content: ' + content);
    this.http.put(url, content, {headers: this.headers})
      .catch(this.errorHandler)
      .subscribe(res => console.log(res));
  }

  getSettingsDefaults(): Observable<SettingsDefaults> {
    return this.http.get(`${this.api}/settingsdefaults`)
      .map(response => {
        return SettingsFactory.defaultsFromJSON(response.json());
      })
      .catch(this.errorHandler);
  }

  getSettings(): Observable<Settings> {
    return this.http.get(`${this.api}/settings`)
      .map(response => response.json())
      .map(settings => SettingsFactory.fromJSON(settings))
      .catch(this.errorHandler);
  }

  updateSettings(settings: Settings) {
    const url = `${this.api}/settings`;
    const content = SettingsFactory.toJSON(settings);
    console.log('Update settings using ' + url);
    console.log('Content: ' + content);
    this.http.put(url, content, {headers: this.headers})
      .catch(this.errorHandler)
      .subscribe(res => console.log(res));
  }

  private errorHandler(error: Error | any): Observable<any> {
    console.error(error);
    return Observable.throw(error);
  }
}
