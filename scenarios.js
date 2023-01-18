"use strict";

// units: metres, metres per second, degrees


const scenarios = [
    {
        heading: 0,
        altitude: 1036, //3400ft
        ias: 105.461, //205kt
        rwy_pos: [0, 12964], //7nm north
        rwy_elev: 0,
        rwy_qfu: 0,
        title: "Easy From Here",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
    },
    {
        heading: 180,
        altitude: 2438.4, //8000ft
        ias: 105.461, //205kt
        rwy_pos: [-3704, 0], //5nm north
        rwy_elev: 60.96, //200ft
        rwy_qfu: 0,
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
        title: "Downwind Right"
    },
    {
        heading: 180,
        altitude: 914, //3000ft
        ias: 105.461, //205kt
        rwy_pos: [3704, 0], //5nm north
        rwy_elev: 0,
        rwy_qfu: 0,
        title: "Downwind Left; Low",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
    },
    {
        heading: 0,
        altitude: 2438.4, //8000ft
        ias: 128.611, //250kt
        rwy_pos: [6548, 6548], //5nm northeast
        rwy_elev: 60.96, //200ft
        rwy_qfu: 45,
        title: "Too High, Too Fast",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
    },
    {
        heading: 90,
        altitude: 1676, //5500ft
        ias: 105.5, //205kt
        rwy_pos: [0, -1500],
        rwy_elev: 152.4, //500ft
        rwy_qfu: 0,
        title: "Overhead",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
    },
    // {
    //     heading: 180,
    //     altitude: 1067, //3500ft
    //     ias: 128.5, //250kt
    //     rwy_pos: [0, 9260], //5nm behind
    //     rwy_elev: 152.4, //500ft
    //     rwy_qfu: 0,
    //     title: "Turnback, 3000ft aal, 5nm"
    // },
    {
        heading: 180,
        altitude: 1920, //6300ft
        ias: 128.5, //250kt
        rwy_pos: [0, 14816], //8nm
        rwy_elev: 152.4, //500ft
        rwy_qfu: 0,
        title: "Turnback, 5800ft aal, 8nm",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, 5.1444, "10kt tailwind"], //souththerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, 5.4565, "15kt quartering from right"], //15kt south-easterly
            [0, 10.2889, "20kt tailwind"], // southerly, 20kt
        ],
    },
    {
        heading: 0,
        altitude: 2134, //7000ft
        ias: 128.5, //250kt
        rwy_pos: [0, 29632], //16nm north
        rwy_elev: 304.8, //1000ft
        rwy_qfu: 45,
        title: "Stretch",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
    },
    {
        heading: 0,
        altitude: 4268, //14000ft
        ias: 128.5, //250kt
        rwy_pos: [0, 31484], //17nm north
        rwy_elev: 304.8, //1000ft
        rwy_qfu: 45,
        title: "Absorb",
        wind: [
            [0, 0, "Calm"], //calm
            [0.0000, -5.1444, "10kt headwind"], //northerly, 10kt
            [-5.1444, -0.0000, "10kt crosswind from right"], //easterly, 10kt
            [5.1444, -0.0000, "10kt crosswind from left"], //easterly, 10kt
            [-5.4565, -5.4565, "15kt quartering from right"], //15kt north-easterly
            [0, -10.2889, "20kt headwind"], // northerly, 20kt
        ],
    },

];

export {scenarios}
