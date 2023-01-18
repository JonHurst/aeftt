"use strict";

import {_TESTING} from "../modules/model.js";
let assert = chai.assert;

const $ = _TESTING;
const [X, Y, Z] = [0, 1, 2];

describe('ISA functions', function() {
    it('density_ratio tests', function() {
        // density ratio at 0ft should be 1
        assert.equal($.density_ratio(0), 1);
        //valuse from https://www.digitaldutch.com/atmoscalc/table.htm
        assert.equal($.density_ratio(3000).toFixed(5), 0.74214);
        assert.equal($.density_ratio(6000).toFixed(5), 0.53852);
    });

    it('airspeed conversions', function() {
        // sea level should be equal
        assert.equal($.to_tas(100, 0), 100);
        assert.equal($.to_ias(100, 0), 100);
        let tas1 = $.to_tas(100, 3000);
        let tas2 = $.to_tas(100, 6000);
        // values from https://aerotoolbox.com/airspeed-conversions/
        assert.equal(tas1.toFixed(2), 116.08);
        assert.equal(tas2.toFixed(2), 136.27);
        // should be able to round trip
        assert.equal($.to_ias(tas1, 3000), 100);
        assert.equal($.to_ias(tas2, 6000), 100);
    });

    it('tas from vector', function() {
        // zero vector should give zero
        assert.equal($.tas([0, 0, 0]), 0);
        // hand calculated
        assert.equal($.tas([10, 20, 30]).toFixed(2), 37.42);
    });
});

describe('Acceleration resolution', function() {
    it('Resolving accelerations', function() {
        // along x axis, with tangent 1 and normal 2 acceleration
        assert.sameOrderedMembers(
            $.resolve_accel(1, 2, [10, 0, 0]),
            [1, -2, 0]);
        // along y axis, with tangent 1 and normal 2 acceleration
        assert.sameOrderedMembers(
            $.resolve_accel(1, 2, [0, 10, 0]),
            [2, 1, 0]);
        //along y=x, with tangent sqrt(2) acceleration
        assert.sameOrderedMembers(
            $.resolve_accel(Math.sqrt(2), 0, [10, 10, 0]),
            [1, 1, 0]);
        //along y=x, with normal sqrt(2) acceleration
        assert.sameOrderedMembers(
            $.resolve_accel(0, Math.sqrt(2), [10, 10, 0]),
            [1, -1, 0]);
        //along y=x, with tangent and normal sqrt(2) acceleration
        assert.sameOrderedMembers(
            $.resolve_accel(Math.sqrt(2), Math.sqrt(2), [10, 10, 0]),
            [2, 0, 0]);
        //along z axis, with tangent 1 and normal 2 acceleration
        assert.throws(
            () => $.resolve_accel(1, 2, [0, 0, 10]),
            /Cannot resolve/);
        //along y=z, x=0 with tangent sqrt(2)
        assert.sameOrderedMembers(
            $.resolve_accel(Math.sqrt(2), 0, [0, 20, 20]),
            [0, 1, 1]);
        //along y=z, x=0 with normal 1
        assert.sameOrderedMembers(
            $.resolve_accel(0, 1, [0, 20, 20]),
            [1, 0, 0]);
    });
});

describe("Published glide ratios", function() {
    it('400ft per nm, clean, 205kt, 8000ft', function() {
        const c = {
            speedup: 1,
            tgt_hdg: 90,
            zero_crossing_count: 0,
            tgt_ias: 105.461
        };
        let d = {
            pos: [0, 0, 2438.4], // 8000ft
            vel: [$.to_tas(105.461, 2438.4), 0, 0],
            a_n: 0,
            a_t: 0,
            wind: [0, 0, 0]
        };
        const conf = {
            gear: 0,
            flap: 0,
            speedbrake: 0
        };
        // run model to 7000ft
        while(d.pos[Z] > 2133.6) {
            d = $.tick(d, c, conf, [0,0,0]);
        }
        assert.closeTo(d.pos[X], 4630, 100);
        console.log("8000:", d.pos[X] - 4630);

    });


    it('400ft per nm, clean, 205kt, 14000ft', function() {
        const c = {
            speedup: 1,
            tgt_hdg: 90,
            zero_crossing_count: 0,
            tgt_ias: 105.461
        };
        let d = {
            pos: [0, 0, 4267.2], // 14000ft
            vel: [$.to_tas(105.461, 4267.2), 0, 0],
            a_n: 0,
            a_t: 0,
            wind: [0, 0, 0]
        };
        const conf = {
            gear: 0,
            flap: 0,
            speedbrake: 0
        };
        // run model to 12000ft
        while(d.pos[Z] > 3657.6) {
            d = $.tick(d, c, conf, [0,0,0]);
        }
        assert.closeTo(d.pos[X], 9260, 100);
        console.log("14000:", d.pos[X] - 9260);
    });


    it('500ft per nm, clean, 300kt, 14000ft', function() {
        const c = {
            speedup: 1,
            tgt_hdg: 90,
            zero_crossing_count: 0,
            tgt_ias: 154.33
        };
        let d = {
            pos: [0, 0, 4267.2], // 14000ft
            vel: [$.to_tas(154.33, 4267.2), 0, 0],
            a_n: 0,
            a_t: 0,
            wind: [0, 0, 0]
        };
        const conf = {
            gear: 0,
            flap: 0,
            speedbrake: 0
        };
        // run model to 12000ft
        while(d.pos[Z] > 3657.6) {
            d = $.tick(d, c, conf, [0,0,0]);
        }
        assert.closeTo(d.pos[X], 7408, 200);
        console.log("300kt, 14000:", d.pos[X] - 7408);
    });


    it('3000ft conf 2, gear down, 163kt, 600ft per nm', function() {
        const c = {
            speedup: 1,
            tgt_hdg: 0,
            zero_crossing_count: 0,
            tgt_ias: 83.85
        };
        let d = {
            pos: [0, 0, 914.4], // 3000ft
            vel: [0, $.to_tas(83.85, 914.4), 0],
            a_n: 0,
            a_t: 0,
            wind: [0, 0, 0]
        };
        const conf = {
            gear: 1,
            flap: 2,
            speedbrake: 0
        };
        // run model to 1000ft
        while(d.pos[Z] > 304.8) {
            d = $.tick(d, c, conf, [0,0,0]);
        }
        assert.closeTo(d.pos[Y], 6173, 100);
        console.log("Final:", d.pos[Y] - 6173);
    });


});


describe('Wind calculation', function() {
    it("Wind at sfc doesn't change", function() {
        assert.deepEqual($.wind([1, 1], 0), [1, 1, 0]);
    });

    it('Northerly, 10kt, 2000ft', function() {
        const sfc_wind = [0, -5.14444];
        const new_wind = $.wind(sfc_wind, 609.6);
        assert.closeTo(Math.hypot(...new_wind), 1.4 * Math.hypot(...sfc_wind), 0.001);
        const hand_calc_wind = [
                1.4 * Math.sin(Math.PI / 9) * -5.14444,
            1.4 * Math.cos(Math.PI / 9) * -5.14444,
            0
        ];
        assert.deepEqual(
            new_wind.map(v => v.toFixed(7)),
            hand_calc_wind.map(v => v.toFixed(7)));
    });

    it('Westerly, 10kt, 2000ft', function() {
        const sfc_wind = [5.14444, 0];
        const new_wind = $.wind(sfc_wind, 609.6);
        assert.closeTo(Math.hypot(...new_wind), 1.4 * Math.hypot(...sfc_wind), 0.001);
        const hand_calc_wind = [
            1.4 * Math.cos(Math.PI / 9) * 5.14444,
            -1.4 * Math.sin(Math.PI / 9) * 5.14444,
            0
        ];
        assert.deepEqual(
            new_wind.map(v => v.toFixed(7)),
            hand_calc_wind.map(v => v.toFixed(7)));
    });

    it('Westerly, 10kt, 4000ft', function() {
        const sfc_wind = [5.14444, 0];
        const new_wind = $.wind(sfc_wind, 1219.2);
        assert.closeTo(Math.hypot(...new_wind), 1.6 * Math.hypot(...sfc_wind), 0.001);
        const hand_calc_wind = [
            1.6 * Math.cos(Math.PI / 6) * 5.14444,
            -1.6 * Math.sin(Math.PI / 6) * 5.14444,
            0
        ];
        assert.deepEqual(
            new_wind.map(v => v.toFixed(7)),
            hand_calc_wind.map(v => v.toFixed(7)));
    });
});


describe('Track calculation', function() {
    it("Into wind E", function() {
        assert.equal(
            $.track([1, 0, 0], [-0.1, 0, 0]),
            90
        );
    });
    it("Into wind N", function() {
        assert.equal(
            $.track([0, 1, 0], [0, -0.1 , 0]),
            0
        );
    });
    it("Straight tailwind", function() {
        assert.equal(
            $.track([1, 0, 0], [0.1, 0, 0]),
            90
        );
    });
    it("E, Crosswind from S", function () {
        assert.equal(
            $.track([1, 0, 0], [0, 0.1]).toFixed(2),
            90 - 5.71);
    });
});
