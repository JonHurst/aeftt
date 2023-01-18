"use strict";

// Constants

// mass of aircraft of 60000kg
const MASS = 60000;
// gravity
const G = 9.80665;
// green dot indicated airspeed of 205kt
const IAS_GD = 205 * 0.5144;
// green dot drag (from 2.5nm per 1000ft in the QRH AEF checklist) 2.3 since
// decreasing TAS with increasing air density provides extra energy.
const D_GD = MASS * G * 1000 / (2.29 * 6076);
// form drag delta multipliers
// from https://www.sesarju.eu/sites/default/files/documents/sid/2018/papers/SIDs_2018_paper_75.pdf
// k constant with changing configuration due minimal change in aspect ratio
// fuel penalty factor for gear extended is 180%
// fuel penalty factor for slats fully extended is 60%, assume slat 2 ~ 40%
// implies gear contributes around 4.5 times the drag of slat 2
const M_GEAR = 0.8325;
const M_SLAT2 = 0.185;
// speedbrake doesn't do much as only one spoiler working, assume same as slat 1
const M_SP = M_SLAT2 / 2;

// duration of a model "tick" in seconds
const TICK = 0.05;

// maximum a_N (lateral acceleration equivalent to 30° bank)
const MAX_A_N = G / Math.sqrt(3);
// maximum roc of a_N (3 seconds to reach 30° bank)
const MAX_ROC_A_N = MAX_A_N * TICK / 3;

// maimum a_T (longitudinal acceleration approx 2kt/second)
const MAX_A_T = 1;
const MAX_ROC_A_T = MAX_A_T * TICK / 10;

// positions in vectors
const X = 0;
const Y = 1;
const Z = 2;

let rads = (degrees) => degrees * Math.PI / 180;


class Model {

    constructor() {
        this.elapsed_time = 0;
        this.timerID = null;
    }


    set_scenario(scenario, wind_index) {
        const tas = to_tas(scenario.ias, scenario.altitude);
        this._sfc_wind = scenario.wind[wind_index];
        this._data = {
            pos: [0, 0, scenario.altitude],
            vel: [
                tas * Math.sin(rads(scenario.heading)),
                tas * Math.cos(rads(scenario.heading))
                , 0],
            a_n: 0,
            a_t: 0,
            wind: wind(this._sfc_wind, scenario.altitude),
        };
        this._data.track = track(this._data.vel, this._data.wind);
        this._control = {
            speedup: 1,
            tgt_hdg: scenario.heading,
            tgt_ias: scenario.ias,
            zero_crossing_count: 0
        };
        this._config = {
            gear: 0,
            flap: 0,
            speedbrake: 0
        };
        this._runway = {
            pos: [...scenario.rwy_pos, scenario.rwy_elev],
            qfu: scenario.rwy_qfu
        };
    }


    start() {
        if(!this.timerID) {
            this.timerID = window.setInterval(
                this._on_timer.bind(this),
                TICK * 1000 / this._control.speedup);
        }
    }


    stop() {
        if(this.timerID) {
            window.clearInterval(this.timerID);
            this.timerID = null;
        }
    }


    _on_timer() {
        this.elapsed_time += TICK;
        let old_xvel = this._data.vel[X];
        this._data = tick(this._data, this._control, this._config, this._sfc_wind);
        // track crossings of north heading
        if(this._data.vel[Y] > 0) {
            if(old_xvel < 0 && this._data.vel[X] >= 0)
                this._control.zero_crossing_count++;
            else if(old_xvel >= 0 && this._data.vel[X] < 0)
                this._control.zero_crossing_count--;
        }
        if(this._data.pos[Z] <= this._runway.pos[Z]) {
            this._data.pos[Z] = this._runway.pos[Z];
            this.stop();
        }
    }


    get running() {return !!this.timerID;}

    set_runway(_pos, _qfu) {this.runway = {pos: _pos, qfu: _qfu};}
    get rwy_pos() {return [...this._runway.pos];}
    get rwy_qfu() {return this._runway.qfu;}

    get heading() {return heading(this._data.vel);}
    get position() {return this._data.pos;}
    get rod() {return -this._data.vel[Z];}
    get ias() {return to_ias(tas(this._data.vel), this._data.pos[Z]);}
    get wind() {return this._data.wind;}
    get track() {return this._data.track;}

    get target_ias() {return this._control.tgt_ias;}
    increment_target_ias(inc) {
        let valid_speed_range = speed_range(this._config.flap, this._config.gear);
        let requested_ias = this._control.tgt_ias + inc;
        let target_ias = Math.max(
            Math.min(valid_speed_range[1], requested_ias),
            valid_speed_range[0]);
        if(this._control.tgt_ias === target_ias) return false;
        this._control.tgt_ias = target_ias;
        return true;
    }
    get target_heading() {return ((this._control.tgt_hdg % 360) + 360) % 360;}
    increment_target_heading(inc) {
        const new_target = this._control.tgt_hdg + inc;
        const heading = this.heading + this._control.zero_crossing_count * 360;
        if(Math.abs(new_target - heading) > 360) return false;
        this._control.tgt_hdg = new_target;
        return true;
    }
    get conf() {return this._config.flap;}
    increment_conf(inc) {
        const request = this._config.flap + inc;
        const new_target = Math.min(Math.max(request, 0), 4);
        if(new_target === this._config.flap) return false;
        const range = speed_range(new_target, this._config.gear);
        if(this.ias < range[0] || this.ias > range[1]) return false;
        this._config.flap = new_target;
        // limit target to range of new config
        if(this._control.tgt_ias < range[0])
            this._control.tgt_ias = range[0];
        if(this._control.tgt_ias > range[1])
            this._control.tgt_ias = range[1];
        // speedbrake autoretract
        if(this._config.flap == 4) {
            this._config.speedbrake = 0;
        }
        return true;
    }
    get sb() {return Math.round(this._config.speedbrake * 4);}
    increment_sb(inc) {
        if(this._config.flap === 4) return false;
        const request = this._config.speedbrake + inc / 4;
        const new_target = Math.max(Math.min(1, request), 0);
        if(new_target === this._config.speedbrake) return false;
        this._config.speedbrake = new_target;
        return true;
    }
    can_extend_gear() { return this.ias <= 133.5; }
    extend_gear() {
        if(this.can_extend_gear) {
            this._config.gear = 1;
            this.increment_target_ias(0);
        }
    }
    gear_deployed() {return this._config.gear;}
}


function heading(v) {
    let _heading = 90 - (Math.atan2(v[Y], v[X]) * 180 / Math.PI);
    return _heading >= 0 ? _heading : _heading + 360;
}


function tas(v) {
    return Math.sqrt(v[X]**2 + v[Y]**2 + v[Z]**2);
}


function density_ratio(alt) {
    // https://www.grc.nasa.gov/www/k-12/airplane/atmosmet.html
    let temperature_ratio = (288.15 - 0.0065 * alt) / 288.15;
    return temperature_ratio**4.255933;
}


function wind(sfc_wind, height) {
    // assume wind veers by 30 degrees and in increases by 60%
    // between surface and 914.4m (3000ft) aal, both linearly
    // wherafter it is constant with altitude
    const frac = Math.min(height, 914.4) / 914.4;
    const veer_angle = frac * Math.PI / 6;
    const intensity = 1 + frac * 0.6;
    const c = Math.cos(veer_angle);
    const s = Math.sin(veer_angle);
    return [
        intensity * (c * sfc_wind[X] + s * sfc_wind[Y]),
        intensity * (-s * sfc_wind[X] + c * sfc_wind[Y]),
        0
    ];
}


function to_tas(ias, alt) {
    return ias / Math.sqrt(density_ratio(alt));
}


function to_ias(tas, alt) {
    return tas * Math.sqrt(density_ratio(alt));
}


function a_n(hdg, tgt, cur) {
    // hdg: current heading
    // tgt: target heading
    // cur: current lateral acceleration
    //
    // returns: required lateral acceleration
    let diff = tgt - hdg;
    const tgt_a_n = Math.max(-1, Math.min(1, diff / 10)) * MAX_A_N;
    const tgt_diff = tgt_a_n - cur;
    const roc_a_n = Math.max(-1, Math.min(1, tgt_diff / 3)) * MAX_ROC_A_N;
    return cur + roc_a_n;
}


function a_t(tas, tgt, cur, vs) {
    let diff = tgt - tas;
    let m = 1;
    if(diff < 0) {
        m = -1;
        diff = -diff;
        cur = -cur;
    }
    const a_t_target = (0.05 + 0.95 * Math.min(1, diff / 10)) * MAX_A_T;
    const roc = Math.min((a_t_target - cur) / 10, MAX_ROC_A_T);
    if(vs > 0.25 || m == 1)
        cur += roc;
    return m * Math.min(a_t_target, cur);
}


function resolve_accel(a_t, a_n, vel) {
    if(!(vel[X] || vel[Y])) throw Error(`Cannot resolve accelerations using ${vel}`);
    const mag_t = tas(vel);
    // a_t vector has magnitude a_t in direction of unit vector of vel
    const vec_a_t = vel.map(v => a_t * v / mag_t);
    const mag_n = Math.sqrt(vel[X]**2 + vel[Y]**2);
    // a_n vector has magnitude a_n in direction perp to vel in horiz plane
    const vec_a_n = [vel[Y], -vel[X], 0].map(v => a_n * v / mag_n);
    return vec_a_t.map((v, c) => v + vec_a_n[c]);
}


function drag(ias, g_load, gear, flap, sb) {
    const m_gear = gear * M_GEAR;
    const m_spdbrake = sb * M_SP;
    const m_flap = [0, 1, 2, 2, 3][flap] * M_SLAT2 / 2;
    const cd0_mult = 1 + m_gear + m_spdbrake + m_flap;
    let D = (D_GD / 2) * (cd0_mult * (ias / IAS_GD)**2 + g_load**2 * (IAS_GD / ias)**2);
    return D;
}


function track(vel, wind) {
    const x = vel[X] + wind[X];
    const y = vel[Y] + wind[Y];
    let track = Math.atan2(x, y) * 180 / Math.PI;
    if(track < 0) track += 360;
    return track;
}


function speed_range(conf, gear) {
    // for minimum speeds, use Vapp for configuration
    // for maximum speeds, use placard speeds + 10kt
    let range = [
        [92.6, 180], //conf 0 180kt-350kt
        [79.7, 123.5], //conf 1 155kt-240kt
        [79.7, 108], //conf 2 155kt-210kt
        [79.7, 100.3], //conf 3 155kt-195kt
        [79.7, 96.2]  //conf full 155kt-187kt
    ][conf];
    if(gear)
        range[1] = Math.min(133.7, range[1]); //max with gear 260kt
    return range;
}


function tick(d, c, conf, sfc_wind) {
    // adjust accelerations to reach target heading and ias
    let _a_t = a_t(tas(d.vel), to_tas(c.tgt_ias, d.pos[Z]), d.a_t, d.vel[Z]);
    let _a_n = a_n(heading(d.vel) + 360 * c.zero_crossing_count, c.tgt_hdg, d.a_n);
    // calculate approximate velocity vector after half a tick
    let a = resolve_accel(_a_t, _a_n, d.vel);
    let vel_mid = d.vel.map((v, c) => v + a[c] * TICK / 2);
    // now resolve accelerations using this approx mid-point velocity vector
    a = resolve_accel(_a_t, _a_n, vel_mid);
    // calculate new velocities and positions
    let vel = d.vel.map((v, c) => v + a[c] * TICK);
    let pos = a.map((a, c) => d.pos[c] + d.vel[c] * TICK + (a * TICK**2) / 2);
    // correct vertical velocity and position
    // use end velocities for KE change
    const deltaKE = (MASS/2) * ((tas(vel)**2) - (tas(d.vel)**2));
    // use mid point velocities for drag
    const _tas = tas(vel_mid);
    const ias = to_ias(_tas, d.pos[Z]);
    const g_load = Math.sqrt(9.82**2 + _a_n**2 + _a_t**2) / 9.82;
    const work = _tas * drag(ias, g_load, conf.gear, conf.flap, conf.speedbrake) * TICK;
    let delta_height = (work + deltaKE) / (MASS * G);
    // wind gradient causes reference frame to become non-inertial. Add correction
    // using pseudo force in opposite direction to acceleration of frame.
    const old_wind_vec = d.wind;
    const new_wind_vec = wind(sfc_wind, d.pos[Z] - delta_height);
    const wind_accel = new_wind_vec.map((v, c) => (v - old_wind_vec[c]) / TICK);
    const pseudo_force = wind_accel.map(v => -MASS * v);
    const pseudo_work = pseudo_force
          .map((f, c) => f * (pos[c] - d.pos[c])).
          reduce((a, c) => a + c);
    delta_height -= pseudo_work / (MASS * G);
    pos[Z] = d.pos[Z] - delta_height;
    vel[Z] = delta_height / TICK;
    // apply wind to pos
    pos = pos.map((p, c) => p + (old_wind_vec[c] + new_wind_vec[c]) * TICK / 2);
    // return new data
    return {
        pos: pos,
        vel: vel,
        a_n: _a_n,
        a_t: _a_t,
        wind: [...new_wind_vec],
        track: track(vel, new_wind_vec)
    };

}


// export module functions for unit tests
let _TESTING = {};
_TESTING.density_ratio = density_ratio;
_TESTING.to_tas = to_tas;
_TESTING.to_ias = to_ias;
_TESTING.tas = tas;
_TESTING.resolve_accel = resolve_accel;
_TESTING.tick = tick;
_TESTING.wind = wind;
_TESTING.track = track;

export {Model, _TESTING};
