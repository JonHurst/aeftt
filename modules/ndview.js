"use strict";

const X = 0;
const Y = 1;

const svgpos = p => [p[0] / 370.4, -p[1] / 370.4];
let kt = (mps) => mps * 1.94384;
const zpad3 = v => ('00' + v).slice(-3);

class NDView {
    constructor(fm) {
        this.model = fm;
        this.rw_grp = document.getElementById("ndview-runway");
        this.rw_innergrp = document.getElementById("ndview-runway-inner");
        this.bc_grp = document.getElementById("ndview-breadcrumbs");
        this.tick_group = document.getElementById("ndview-ticks");
        this.hdg_bug = document.getElementById("hdg_bug");
        this.wind_text = document.getElementById("ndview-windtext");
        this.wind_arrow = document.getElementById("ndview-windarrow");
        this.track_diamond = document.getElementById("ndview-track-diamond");
        this.hol = document.getElementById("ndview-hol");
        this.landed_msg = document.getElementById("ndview-landedmsg");
        build_heading_ticks();
        this.reset();
    };


    reset() {
        this.scale = 2; // 0.5 for 40nm, 1 for 20nm, 2 for 10nm
        this.last_breadcrumb = 0;
        this.bc_grp.replaceChildren();
        this.landed_msg.classList.add("hidden");
        this.hol.classList.remove("hidden");
        this.bc_grp.classList.remove("hidden");
    }


    update() {
        if(this.model.position[2] === this.model.rwy_pos[2]) {
            this.scale = 8;
            this.landed_msg.classList.remove("hidden");
            this.hol.classList.add("hidden");
            this.bc_grp.classList.add("hidden");
        }
        this.runway_pos = svgpos(this.model.rwy_pos);
        this.runway_qfu = this.model.rwy_qfu;
        const heading = this.model.heading;
        const [x, y]  = svgpos(this.model.position);
        const [dx, dy] = [x, y].map((v, i) => this.runway_pos[i] - v);
        this.hdg_bug.setAttribute("transform", `rotate(${this.model.target_heading})`);
        this.tick_group.setAttribute("transform", `rotate(${-heading})`);
        this.track_diamond.setAttribute(
            "transform", `rotate(${this.model.track - heading})`);
        this.rw_innergrp.setAttribute("transform", `rotate(${this.runway_qfu})`);
        this.rw_grp.setAttribute(
            "transform",
            `scale(${this.scale}) translate(${dx} ${dy}) rotate(${-heading} ${-dx} ${-dy})`);
        //wind
        const [wx, wy] = this.model.wind;
        const wstr = Math.round(Math.hypot(wx, wy) * 1.943844);
        const wdir = wstr ? Math.round((Math.atan2(wx, wy) + Math.PI) * 180 / Math.PI): 0;
        this.wind_text.textContent = `${zpad3(wdir)}°/${wstr}kt`;
        this.wind_arrow.setAttribute("transform", `rotate(${wdir - heading})`);
        // drop breadcrumb every 10 seconds
        if(this.model.elapsed_time >= this.last_breadcrumb) {
            let bc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bc.setAttribute('cx', -dx);
            bc.setAttribute('cy', -dy);
            bc.setAttribute('r', 0.5);
            bc.classList.add("breadcrumb");
            this.bc_grp.appendChild(bc);
            this.last_breadcrumb = this.model.elapsed_time + 10;
        }
    };


    set_scale(range) {
        if(range == 20) {
            this.scale = 1;
        }
        else if(range == 10) {
            this.scale = 2;
        }
        else {
            console.log(`Range ${range} not supported`);
        }
        this.update();
    };
}

function build_heading_ticks() {
    const tick_group = document.getElementById("ndview-ticks");
    for(let c = 0; c < 360; c+=5) {
        let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        let rad = c * Math.PI / 180;
        let tick_length = 2;
        if(c % 30 == 0) {
            tick_length = 8;
            let t = document.createElementNS("http://www.w3.org/2000/svg", "text");
            t.setAttribute("x", "-5");
            t.setAttribute("y", "-88");
            t.setAttribute("textLength", "10");
            t.setAttribute("transform", `rotate(${c})`);
            t.textContent = ("00" + c.toFixed(0)).slice(-3);
            t.classList.add("ndview-ticktext");
            tick_group.appendChild(t);
        }
        else if(c % 10 == 0) {
            tick_length = 4;
        }
        let x1 = 100 * Math.sin(rad);
        let x2 = (100 - tick_length) * Math.sin(rad);
        let y1 = -100 * Math.cos(rad);
        let y2 = (-100 + tick_length) * Math.cos(rad);
        l.setAttribute("x1", x1.toString());
        l.setAttribute("x2", x2.toString());
        l.setAttribute("y1", y1.toString());
        l.setAttribute("y2", y2.toString());
        tick_group.appendChild(l);
    }
}

export {NDView};
