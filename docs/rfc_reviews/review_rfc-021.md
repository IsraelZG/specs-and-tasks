# Revisão RFC-021: Mapa

## 1. Validação da Ideia Central
A extração do Mapa para uma lente comum utilitária consumível evita um dos piores antipatterns do software corporativo: o ERP ter um input de endereço, o CRM outro e o Checkout outro. O uso robusto de R*Tree local (`geo_index`) provê capacidades de radar hiper-rápidas para o app sem precisar pingar o Google Maps para cálculos de bounding box.

## 2. Refinamentos e Adições Sugeridas
- **Geofencing Nativo:** Adicionar à R*Tree suporte nativo a polígonos simples, não apenas pontos (Long/Lat). Isso permite que a `SPEC:WORKFLOW` de Logística valide entregas apenas se a coordenada do *Proof of Delivery* estiver dentro do Polígono da Região.
- **Prevenção de Fugas de Chave (API Keys Externas):** O conector Classe E puxa dados do Google/Mapbox (A.2). Para proteger as Chaves de API contra roubo em Clients P2P (já que não há backend), a chave do provedor DEVE estar retida no System Peer do Operador de Node e não exposta no frontend React, ocorrendo um *proxy seguro* para requests externos.

## 3. Design System & UI Layout
### Ideias de Layout
- MapCanvas Integrado: O componente renderiza OpenStreetMap/Mapbox mas aceita ser Injetado por Pins reativos de outros módulos. (Ex: ERP injeta o Pin do Cliente no mesmo mapa onde a Logística injeta o Caminhão ao vivo).
- Map-Overlay Card: Cards de interface transparentes flutuando sobre a visualização Cartográfica em vez de colunas duras.

### Componentes Necessários
- **Atoms:** `CustomGeoPin` (Com ícones temáticos baseados na SPEC), `ZoomControl`.
- **Molecules:** `PlaceAutocompleteInput` (Campo de busca híbrido: RRF local + Google Places Fallback).
- **Organisms:** `InteractiveMapCanvas` (A tela primária gerida pela lib de mapa).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPEC:PLACE` (Materializado no Grafo ou `LOCAL_TRANSIENT`).
- **Arestas:** 
  - `LOCATED_AT` (Ligando Perfil, Evento, Empresa ou Anúncio à coordenada).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Usuário insere um endereço, o Conector classe E converte para Coordenada, que é indexada na R*Tree local.
- **Mutação:** Places podem ser atualizados (ex: Loja muda de endereço). O histórico fica preservado.
- **Fim de Vida:** TTL expira para dados de Cache de terceiros (Termos de Serviço do Google Maps). Dados nativos mantêm-se.
