// Iniciar o mapa e adicionar aonde ele vai centralizar
var map = L.map('map', {
    center: [-3.1019,  -60.0250],
    zoom: 13,
    layers: []
})

//adiciona a imagem do mapa na tela
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);




//Pegar o arquivo JSON
fetch('./UNIDADES_SEMSA_REV_20072026.json')
.then(response => response.json())
.then(data => {

    var marcador;

    //Acessar as coordenadas
    var coordenadas = data.objects.UNIDADES_SEMSA_REV_20072026.geometries;
    var latitudeUnidade;
    var longitudeUnidade;
    //Utilizar da biblioteca Proj4 para converter as coordenadas RTM para WGS84
    proj4.defs("RTM_MANAUS",
        "+proj=tmerc +lat_0=0 +lon_0=-60 +k=0.999995 +x_0=400000 +y_0=5000000 +ellps=GRS80 +units=m +no_defs +type=crs"
    );
    proj4.defs("EPSG:4326","+proj=longlat +datum=WGS84 +no_defs +type=crs");

    //os filtros
    var camadaTodos = L.layerGroup().addTo(map);
    var camadaRaiva = L.layerGroup()
    var camadaBCG = L.layerGroup()
    var camadaBCGeRAIVA = L.layerGroup()


    
    //Usar o forEach para adicionar um marcador toda vez que pegar uma coordenada
    coordenadas.forEach(function(geometry){
        
        var x = geometry.coordinates[0];
        var y = geometry.coordinates[1];
        
        
        
        //converter as coordenadas e guardar na variável x e y
        var resultado = proj4( 
            "RTM_MANAUS",
           "EPSG:4326",
           [x, y]
        )

        var meuIconePng = L.icon({
            iconUrl: './img/unidade2.png', 
            iconSize: [32, 32],   
            iconAnchor: [16, 32], 
            popupAnchor: [0, -32] 
        });
        
        //Convertendo a ordem para o leaflet poder usar
        longitudeUnidade = resultado[0];
        latitudeUnidade = resultado[1]
        var popupContent = `
            <p><b>EAS:</b> ${geometry.properties.EAS}<br>
            <b>TIPO:</b> ${geometry.properties.TIPO}<br>
            <b>BAIRRO:</b> ${geometry.properties.BAIRRO}</p>
            <b>VACINAS:</b><br>
            <b>RAIVA:</b> ${geometry.properties.RAIVA_H}<br>
            <b>BCG:</b> ${geometry.properties.BCG}</p>
            <a class="link" href="https://www.google.com/maps/search/?api=1&query=${latitudeUnidade}%2C${longitudeUnidade}" target="_blank">Google Maps</a>
        `;

        var marcador = L.marker([latitudeUnidade, longitudeUnidade], { icon:meuIconePng }).bindPopup(popupContent);

        camadaTodos.addLayer(marcador);
        
        if(geometry.properties.RAIVA_H === "SIM"){
            camadaRaiva.addLayer(L.marker([latitudeUnidade, longitudeUnidade], { icon: meuIconePng }).bindPopup(popupContent));
        } 
        if(geometry.properties.BCG === "SIM"){
            camadaBCG.addLayer(L.marker([latitudeUnidade, longitudeUnidade], { icon: meuIconePng }).bindPopup(popupContent));
        }
        if(geometry.properties.RAIVA_H === "SIM" && geometry.properties.BCG === "SIM"){
            camadaBCGeRAIVA.addLayer(L.marker([latitudeUnidade, longitudeUnidade], { icon: meuIconePng }).bindPopup(popupContent));
        }
            
        });
        
        
        
        
        // parte padrão para aparecer o layer
        var baseMaps = {
            "RAIVA": camadaRaiva,
            "BCG": camadaBCG,
            "BCG E RAIVA": camadaBCGeRAIVA,
            "OUTROS": camadaTodos,
        };
        
        var LayerControl = L.control.layers(baseMaps)
        LayerControl.addTo(map)
        
        
        // Daqui para baixo, é a parte de adicionar a funcionalidade de mostrar as unidades por perto.
        
        
        //Configurações da API Geolocation
        const options = {
            maximumAge: 10000,
            enableHighAccuracy: true,
            timeout:15000
            
        }
        const error = (error) => {
            console.log(error)
        }
        
        //Adicionando as funcionalidades do botao ao ser clicado
        let button = document.querySelector('button');

        
        var pertoUsuario = L.layerGroup()
        pertoUsuario.addTo(map)

                        


    button.addEventListener('click', function(){
        navigator.geolocation.getCurrentPosition((pos) => {
            var coords = pos.coords;
            var latitudeUsuario = coords.latitude;
            var longitudeUsuario = coords.longitude;
              var IconePessoaPng = L.icon({
                iconUrl: './img/pessoa.png', 
                iconSize: [45, 45],   
                iconAnchor: [16, 32], 
                popupAnchor: [0, -32] 
            });

        
            L.marker([latitudeUsuario, longitudeUsuario], { icon: IconePessoaPng }).bindPopup(`Você está aqui`).addTo(map);
            var posicaoUsuario = L.latLng(latitudeUsuario, longitudeUsuario);
            
         
            pertoUsuario.clearLayers();

            //verificando qual camada está ativa. Esse método "hasLayer" retorna true ou false
            var raivaAtiva = map.hasLayer(camadaRaiva);
            var bcgAtiva = map.hasLayer(camadaBCG);
            var bcgRaivaAtiva = map.hasLayer(camadaBCGeRAIVA);
            var todosAtiva = map.hasLayer(camadaTodos);

            //no momento do clique, qual camada estiver ativa sera removida
            if(raivaAtiva) map.removeLayer(camadaRaiva);
            if(bcgAtiva) map.removeLayer(camadaBCG);
            if(bcgRaivaAtiva) map.removeLayer(camadaBCGeRAIVA);
            if(todosAtiva) map.removeLayer(camadaTodos);

            // Percorre todas as unidades verificando distância e a camada ativa
            coordenadas.forEach(function(geometry){
                var x = geometry.coordinates[0];
                var y = geometry.coordinates[1];
                
                var resultado = proj4("RTM_MANAUS", "EPSG:4326", [x, y]);
                var longitudeUnidade = resultado[0];
                var latitudeUnidade = resultado[1];
                
                var posicaoUnidade = L.latLng(latitudeUnidade, longitudeUnidade);
                var distancia = posicaoUsuario.distanceTo(posicaoUnidade); 

                //Icone das unidades
                var meuIconePng = L.icon({
                    iconUrl: './img/unidade2.png', 
                    iconSize: [32, 32],     
                    iconAnchor: [16, 32],   
                    popupAnchor: [0, -32]   
                });

                //Aqui definimos o raio de busca para 4KM. 
                var raioLimite = 3000;

                // aqui transformamos o valor boleano de false para true se estiver dentro do requisito do if
                if (distancia <= raioLimite) {
                    var atendeFiltro = false;

                    // se a camada da raiva estiver ativa e o local possuir a vacina, o valor de false vai para true e está apto a aparecer ao redor quando clicar em 
                    // "perto de mim" (se estiver dentro do raio de busca definido anteriormente). 
                    if (raivaAtiva && geometry.properties.RAIVA_H === "SIM") {
                        atendeFiltro = true;
                    } else if (bcgAtiva && geometry.properties.BCG === "SIM") {
                        atendeFiltro = true; 
                    } else if (bcgRaivaAtiva && geometry.properties.BCG === "SIM" && geometry.properties.RAIVA_H === "SIM") {
                        atendeFiltro = true;
                    } else if (todosAtiva || (!raivaAtiva && !bcgAtiva && !bcgRaivaAtiva)) {
                        atendeFiltro = true;
                    }

           
                    //Se tudo estiver atendendo aos requisitos definidos acima, o marcador e as informações serão mostradas. Dentro do Popup, tem um link que leva ao google maps que mostra a rota do usuario ate a unidade que ele escolher
                    if (atendeFiltro) {
                        var popupContent = `
                            <p><b>EAS:</b> ${geometry.properties.EAS}<br>
                            <b>TIPO:</b> ${geometry.properties.TIPO}<br>
                            <b>BAIRRO:</b> ${geometry.properties.BAIRRO}</p>
                            <b>VACINAS:</b><br>
                            <b>RAIVA:</b> ${geometry.properties.RAIVA_H}<br>
                            <b>BCG:</b> ${geometry.properties.BCG}</p>
                            <a class="link" href="https://www.google.com/maps/dir/?api=1&origin=${latitudeUsuario}, ${longitudeUsuario}&destination=${latitudeUnidade}, ${longitudeUnidade}&travelmode=two-wheeler" target="_blank">Google Maps</a>
                        `;

                        L.marker(posicaoUnidade, { icon: meuIconePng }).bindPopup(popupContent).addTo(pertoUsuario);
                    }
                }
            });

        }, error, options);
    });

})// Se caso der erro ao pegar o arquivo JSON
.catch(error => {
    console.log("Erro ao carregar JSON: ", error);
})  