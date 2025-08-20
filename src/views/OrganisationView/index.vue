<template>
  <div id="location">
    <!-- Company & Contact Info -->
    <el-row :gutter="20" id="main-content">
      <!-- Company -->
      <el-col :span="12" class="col-content">
        <div class="block">
          <div class="block-title">Company</div>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="Name">{{
              owner.name
            }}</el-descriptions-item>
            <el-descriptions-item label="Address">{{
              owner.address
            }}</el-descriptions-item>
            <el-descriptions-item label="City">{{
              owner.city
            }}</el-descriptions-item>
            <el-descriptions-item label="State / Province">{{
              owner.state
            }}</el-descriptions-item>
            <el-descriptions-item label="Country">{{
              owner.country
            }}</el-descriptions-item>
            <el-descriptions-item label="Phone">{{
              owner.phone_no
            }}</el-descriptions-item>
            <el-descriptions-item label="Fax">{{
              owner.fax
            }}</el-descriptions-item>
            <el-descriptions-item label="Email">{{
              owner.email
            }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>

      <!-- Contact Person -->
      <el-col :span="12" class="col-content">
        <div class="block">
          <div class="block-title">Contact Person</div>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="Name">{{
              owner.name_person
            }}</el-descriptions-item>
            <el-descriptions-item label="Phone 1">{{
              owner.phone1
            }}</el-descriptions-item>
            <el-descriptions-item label="Phone 2">{{
              owner.phone2
            }}</el-descriptions-item>
            <el-descriptions-item label="Fax">{{
              owner.fax_contact
            }}</el-descriptions-item>
            <el-descriptions-item label="Email">{{
              owner.email_contact
            }}</el-descriptions-item>
            <el-descriptions-item label="Department">{{
              owner.department
            }}</el-descriptions-item>
            <el-descriptions-item label="Position">{{
              owner.position
            }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
    </el-row>

    <!-- Comment -->
    <div class="block" style="margin-top: 20px">
      <div class="block-title">Comment</div>
      <p>{{ owner.comment }}</p>
    </div>

    <!-- Map -->
    <div class="block" style="margin-top: 20px">
      <div class="block-title">Location Map</div>
      <l-map
        style="height: 400px; width: 100%; margin-top: 10px"
        :zoom="zoom"
        :center="center"
      >
        <l-tile-layer :url="url" :attribution="attribution" />
        <l-marker :lat-lng="center">
          <l-popup> {{ owner.address }}, {{ owner.city }} </l-popup>
        </l-marker>
      </l-map>
    </div>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "OwnerView",
  components: { LMap, LTileLayer, LMarker, LPopup },
  data() {
    return {
      owner: {
        name: "Mock Company",
        address: "123 Mock Street",
        city: "Mock City",
        state: "Mock State",
        country: "Mock Country",
        phone_no: "+1-555-123-4567",
        fax: "+1-555-123-4568",
        email: "contact@mockcompany.com",
        name_person: "John Doe",
        phone1: "+1-555-123-4569",
        phone2: "+1-555-123-4570",
        fax_contact: "+1-555-123-4571",
        email_contact: "john.doe@mockcompany.com",
        department: "Engineering",
        position: "Manager",
        comment: "This is a mock comment for testing purposes.",
      },
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      zoom: 13,
      center: [21.0278, 105.8342],
    };
  },
};
</script>

<style scoped>
#location {
  padding: 15px;
}
.block {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  background: #fff;
}
.block-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  color: #333;
}
</style>
