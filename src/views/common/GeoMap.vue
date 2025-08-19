<template>
  <div style="height: 300px; width: 100%; position: relative">
    <l-map
      ref="map"
      :zoom="zoom"
      :center="center"
      :attribution-control="false"
      :max-bounds="vietnamBounds"
      :max-bounds-viscosity="1.0"
      style="height: 100%; width: 100%"
      @click="onMapClick"
    >
      <l-tile-layer :url="url" :attribution="attribution" />

      <!-- Marker mặc định -->
      <l-marker v-if="latLng" :lat-lng="latLng" @click="locationClick">
        <l-popup>{{ popupText }}</l-popup>
      </l-marker>

      <!-- Marker click -->
      <l-marker
        v-if="clickedLatLng"
        :lat-lng="clickedLatLng"
        :icon="redIcon"
        @click="customLocationClick"
      >
        <l-popup>{{ popupText }}</l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix lỗi icon marker không hiển thị
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom icon đỏ
const redIcon = new L.Icon({
  iconUrl: "/img/marker.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [40, 45],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [40, 50],
  shadowAnchor: [5, 48],
});

export default {
  name: "GeoMap",
  props: {
    locationGeo: { type: Object, default: () => ({}) },
  },
  components: { LMap, LTileLayer, LMarker, LPopup },
  data() {
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      zoom: 8,
      center: [21, 106],
      latLng: null,
      attribution: "&copy; <a>Open ATDigitalTester Map</a> contributors",
      popupText: "",
      clickedLatLng: null,
      redIcon,
      vietnamBounds: [
        [8.18, 102.14], // Cà Mau
        [23.39, 109.46], // biên giới phía Bắc
      ],
    };
  },
  methods: {
    onMapClick(e) {
      this.clickedLatLng = e.latlng;
    },
    loadMap(data, sign) {
      if (sign && data) {
        this.center = [data.x, data.y];
        this.latLng = [data.x, data.y];
        this.zoom = 8;
      } else {
        this.center = [21, 106];
        this.latLng = null;
        this.clickedLatLng = null;
        this.popupText = "";
        this.zoom = 8;
      }
    },
    locationClick() {
      this.popupText = `Geo coordinate at (${this.center.join(", ")})`;
    },
    customLocationClick() {
      this.popupText = `Geo coordinate at (${this.clickedLatLng.lat}, ${this.clickedLatLng.lng})`;
    },
    reloadMap() {
      this.$nextTick(() => {
        if (this.$refs.mapRef && this.$refs.mapRef.leafletObject) {
          this.$refs.mapRef.leafletObject.invalidateSize();
        }
      });
    },
  },
};
</script>

<style>
.leaflet-control-attribution a[href*="leaflet"] {
  display: none !important;
}
.custom-attribution {
  font-size: 14px;
  color: #333;
}
.custom-attribution img {
  height: 16px;
  vertical-align: middle;
  margin-right: 5px;
}
</style>
