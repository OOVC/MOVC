window.addEventListener("load", ()=>{
    function sortObj(obj) {
        let sortable = Object.entries(obj);
        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
        return Object.fromEntries(sortable);
    }
    async function go(){
        let geo = (await (await fetch("https://artegoser.github.io/movc/geo/geo.geojson")).json()).features;
        let coarray = await (await fetch("/api/countries")).json();
        let countries = {};
        for(let i = 0; i<coarray.length; i++) countries[coarray[i].idc] = coarray[i]; 

        let totalarea = {};
        let totalcolonies = {};

        for(let g of geo){
            if(g.geometry.type === "Polygon"&&!((g.properties?.type === "sand")||(g.properties?.type === "grass")||(g.properties?.type === "water"))){
                let country = countries[g.properties.name]
                if(!country) continue;
                let polygon = turf.polygon(g.geometry.coordinates);
                let area = turf.area(polygon)/1000/1000;
                totalarea[country.name] = typeof totalarea[country.name] !== "undefined" ? totalarea[country.name]+area : area;
                totalcolonies[country.name] = typeof totalcolonies[country.name] !== "undefined" ? totalcolonies[country.name]+1 : 1;
            }
        }

        totalarea = sortObj(totalarea);
        totalcolonies = sortObj(totalcolonies);

        let countryids = Object.keys(totalarea);
        let indexcountrynames = coarray.map((v)=>v.name) 
        let countryranks = coarray.map((v)=>v.rank);

        let tctx = document.getElementById('territory-chart');

        let tchart = new Chart(tctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(totalarea),
                datasets: [{
                    data: Object.values(totalarea),
                    backgroundColor: palette('tol-rainbow', countryids.length).map(function(hex) {
                        return '#' + hex;
                    })
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display:false
                    },
                    title: {
                        display: true,
                        text: 'Распределение территорий на карте MOVC (км²)'
                    }
                }
            }
        });

        let cctx = document.getElementById('colonies-chart');

        let cchart = new Chart(cctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(totalcolonies),
                datasets: [{
                    data: Object.values(totalcolonies),
                    backgroundColor: palette('tol-rainbow', countryids.length).map(function(hex) {
                        return '#' + hex;
                    })
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display:false
                    },
                    title: {
                        display: true,
                        text: 'Распределение количества отдельных территорий на карте MOVC'
                    }
                }
            }
        });

        let tyctx = document.getElementById('ranks-chart');

        let tychart = new Chart(tyctx, {
            type: 'doughnut',
            data: {
                labels: indexcountrynames,
                datasets: [{
                    data: countryranks,
                    backgroundColor: palette('tol-rainbow', countryids.length).map(function(hex) {
                        return '#' + hex;
                    })
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display:false
                    },
                    title: {
                        display: true,
                        text: 'Рейтинг стран'
                    }
                }
            }
        });
    }

    go()
});