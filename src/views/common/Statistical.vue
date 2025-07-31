
<template>
    <div style="height: 100%;">
        <div style="display: flex;">
            <el-button @click="uploadData" size="small" type="primary">
                <i class="fa-solid fa-cloud-arrow-up"></i>
            </el-button>
            <el-input disabled v-model="uploadName" size="small" style="margin-left: 10px; width: 200px;"></el-input>
            <el-select style="width: 100px; margin-left: 10px;" size="small" v-model="pageOfSearch">
                <el-option
                    v-for="item in pageData"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
            </el-select>
            <el-button style="margin-left: 10px;" @click="confirmData" size="small" type="primary">
                <i class="fa-solid fa-square-check"></i>
            </el-button>
            <input
            type="file"
            ref="fileInput"
            style="display: none;"
            accept=".xlsx, .xls"
            @change="handleFileUpload"
            />
        </div>
        <div style="margin-top: 20px; height: 100%;">
            <el-col style="height: 100%;" :span="6">
                <el-menu default-active="2" style="height: 250px; overflow: auto;" class="el-menu-vertical-demo">
                    <el-menu-item @click="loadData('AllOwner')" index="1-6">
                            <i class="el-icon-folder-opened"></i>
                            <span>All Owner</span>
                    </el-menu-item>
                    
                    <el-menu-item @click="loadData('AllLocation')" index="2">
                        <i class="el-icon-location"></i>
                        <span>Location</span>
                    </el-menu-item>
                    
                        
                    <el-menu-item @click="loadData('AllAsset')" index="3-8">
                        <i  class="el-icon-edit"></i>
                        <span>All Asset</span>
                    </el-menu-item> 
                </el-menu>
            </el-col>
            <el-col v-if="all == 1" :span="18" style="height: 100%; display: flex;">
    <div style="width: 50%; height: 100%;">
        <div>
            <h1 class="chartTitle1">{{ titleChart1 }}</h1>
        </div>
        <BarChart key="1" :chartData="barData1" :chartOptions="barOptions" />
    </div>
    <div class="chart-wrapper">
    <div class="chart-inner">
      <h1 class="chartTitle2">{{ titleChart2 }}</h1>
    </div>
  </div>
</el-col>
<el-col v-else-if="all == 2" :span="18" style="height: 100%; display: flex;justify-content: center; align-items: center;">
    <div style="width: 50%; height: 100%;">
        <div>
            <h1>{{ titleChart1 }}</h1>
        </div>
        <div>
            <h2>{{ titleChart2 }}</h2>
            <p>{{ titleChart2 }}</p>
        </div>
    </div>
</el-col>
            <el-col v-else :span="18">
                
            </el-col>
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import { mapState } from 'vuex'
import BarChart from './BarChart.vue';
import * as ownerAPI from '@/api/ownerAPI/ownerAPI.js'
import * as locationAPI from '@/api/locationAPI/locationAPI.js'
import * as circuitAPI from '@/api/circuit/circuit'
import * as currentAPI from '@/api/current/current'
import * as voltageAPI from '@/api/voltage/voltage'
import * as surgeAPI from '@/api/surge/surge'
import * as disconnectorAPI from '@/api/disconnector/disconnector'
import * as powerAPI from '@/api/power/power'
import * as transformerAPI from '@/api/transformerAPI/transformerAPI.js'
import * as XLSX from "xlsx";
import uuid from '@/utils/uuid';


export default {
    components: {
        BarChart
    },
    data() {
        return {
            all : false,
            uploadName : '',
            uploadContent : null,
            titleChart1 : '',
            titleChart2 : '',
            pageOfSearch : '',
            pageData : [],
            workbook : null,
            barData1: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
                datasets: [
                    {
                    label: 'Dataset 1',
                    data: [10, 20, 30],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                    }
                ]
            },
            barData2: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
                datasets: [
                    {
                    label: 'Dataset 2',
                    data: [10, 20, 30],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                    }
                ]
            },
            barData3: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
                datasets: [
                    {
                    label: 'Dataset 3',
                    data: [10, 20, 30],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                    }
                ]
            },
            barOptions: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true
                    }
                }
            }
        }
    },
    beforeMount() {
  
},
    computed: {
        ...mapState(['selectedLocation', 'selectedAsset'])
    },
    methods: {
        async loadData(data) {
    if(data == "AllOwner" || data == "AllLocation" || data == "AllAsset") {
        if(data == "AllOwner") {
            this.all = 3
            let dataowner = await ownerAPI.countAllOwnerByIds()
            let dataowner1 = await ownerAPI.countAllOwnerByIdsAndMode("OWNER1")
            let dataowner2 = await ownerAPI.countAllOwnerByIdsAndMode("OWNER2")
            let dataowner3 = await ownerAPI.countAllOwnerByIdsAndMode("OWNER3")
            let dataowner4 = await ownerAPI.countAllOwnerByIdsAndMode("OWNER4")
            let dataowner5 = await ownerAPI.countAllOwnerByIdsAndMode("OWNER5")
            this.barData1.labels = ["OWNER1", "OWNER2", "OWNER3", "OWNER4", "OWNER5"]
            this.barData1.datasets[0].data = [dataowner1, dataowner2, dataowner3, dataowner4, dataowner5]
            this.titleChart1 = ""
            this.titleChart2 = "OWNER: " + dataowner
            this.all = 2
        } else if(data == "AllLocation") {
            this.all = 3
            let dataLocationOwner1 = await locationAPI.countLocationsByRefIdOwnerAndModeAndCreatedBy("OWNER1")
            let dataLocationOwner2 = await locationAPI.countLocationsByRefIdOwnerAndModeAndCreatedBy("OWNER2")
            let dataLocationOwner3 = await locationAPI.countLocationsByRefIdOwnerAndModeAndCreatedBy("OWNER3")
            let dataLocationOwner4 = await locationAPI.countLocationsByRefIdOwnerAndModeAndCreatedBy("OWNER4")
            let dataLocationOwner5 = await locationAPI.countLocationsByRefIdOwnerAndModeAndCreatedBy("OWNER5")
            let dataAllLocation = await locationAPI.countLocationsByCreatedByAndCollab()
            let dataLocation = await locationAPI.countLocationsModeByCreatedByAndCollab("location")
            let dataVoltage = await locationAPI.countLocationsModeByCreatedByAndCollab("voltage")
            let dataFeeder = await locationAPI.countLocationsModeByCreatedByAndCollab("feeder")
            this.barData1.labels = ["L-O1", "L-O2", "L-O3", "L-O4", "L-O5"]
            this.barData1.datasets[0].data = [dataLocationOwner1, dataLocationOwner2, dataLocationOwner3, dataLocationOwner4, dataLocationOwner5]
            this.titleChart1 = ""
            this.titleChart2 = "LOCATION: " + dataAllLocation + "\nVOLTAGE: " + dataVoltage + "\nFEEDER: " + dataFeeder            
            this.all = 2
        } else if(data == "AllAsset") {
            this.all = 3
            let dataTransformer = await transformerAPI.countAssetList()
            let dataCircuit = await circuitAPI.countAssetList()
            let dataCurrent = await currentAPI.countAssetList()
            let dataVoltage = await voltageAPI.countAssetList()
            let dataDisconnector = await disconnectorAPI.countAssetList()
            let dataSurge = await surgeAPI.countAssetList()
            let dataPower = await powerAPI.countAssetList()
            let dataAll = parseInt(dataTransformer) + parseInt(dataCircuit) + parseInt(dataCurrent) + parseInt(dataVoltage) + parseInt(dataDisconnector) + parseInt(dataSurge) + parseInt(dataPower)
            this.barData1.labels = ["TRANSFORMER", "CIRCUIT", "CURRENT", "VOLTAGE", "DISCONNECTOR", "SURGE", "CABLE"]
            this.barData1.datasets[0].data = [dataTransformer, dataCircuit, dataCurrent, dataVoltage, dataDisconnector, dataSurge, dataPower]
            this.titleChart1 = ""
            this.titleChart2 = "ASSET: " + dataAll
            this.all = 2
        }
        this.all = 1
    } 
},
        async uploadData() {
            this.$refs.fileInput.click();
        },
        async handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: "array" });
                    const sheetNames = this.workbook.SheetNames;
                    for(let i in sheetNames) {
                        this.pageData.push({
                            value : i,
                            label : sheetNames[i]
                        })
                    }
                }
                reader.readAsArrayBuffer(file) // Đọc file
                this.uploadName = file.name; // Hiển thị tên file
            }
        },
        async confirmData() {
            try {
                const sheetData = this.workbook.SheetNames[this.pageOfSearch];
                const worksheet = this.workbook.Sheets[sheetData];
                this.uploadContent = XLSX.utils.sheet_to_json(worksheet); // Chuyển dữ liệu sang JSON
                if(this.uploadContent != null && this.uploadContent != undefined && this.uploadContent.length != 0) {
                    for (let i = 0; i < this.uploadContent.length; i++) {
                        if ('Contact_MOBILE1' in this.uploadContent[i]) {
                            this.uploadContent[i]['person_phone_no1'] = this.uploadContent[i]['Contact_MOBILE1'];
                            delete this.uploadContent[i]['Contact_MOBILE1'];
                        }
                        if ('Contact_MOBILE2' in this.uploadContent[i]) {
                            this.uploadContent[i]['person_phone_no2'] = this.uploadContent[i]['Contact_MOBILE2'];
                            delete this.uploadContent[i]['Contact_MOBILE2'];
                        }
                        if ('Contact_PersonalEmail' in this.uploadContent[i]) {
                            this.uploadContent[i]['person_email'] = this.uploadContent[i]['Contact_PersonalEmail'];
                            delete this.uploadContent[i]['Contact_PersonalEmail'];
                        }
                        if ('Contact_WorkEmail' in this.uploadContent[i]) {
                            this.uploadContent[i]['company_email'] = this.uploadContent[i]['Contact_WorkEmail'];
                            delete this.uploadContent[i]['Contact_WorkEmail'];
                        }
                        if ('Contact_name' in this.uploadContent[i]) {
                            this.uploadContent[i]['person_name'] = this.uploadContent[i]['Contact_name'];
                            delete this.uploadContent[i]['Contact_name'];
                        }
                        if ('Contact_postion' in this.uploadContent[i]) {
                            this.uploadContent[i]['person_position'] = this.uploadContent[i]['Contact_postion'];
                            delete this.uploadContent[i]['Contact_postion'];
                        }
                        if ('Location_COMMENT' in this.uploadContent[i]) {
                            this.uploadContent[i]['comment'] = this.uploadContent[i]['Location_COMMENT'];
                            delete this.uploadContent[i]['Location_COMMENT'];
                        }
                        if ('Location_Full name' in this.uploadContent[i]) {
                            this.uploadContent[i]['name'] = this.uploadContent[i]['Location_Full name'];
                            delete this.uploadContent[i]['Location_Full name'];
                        }
                        if ('Location_Tỉnh/Thành Phố' in this.uploadContent[i]) {
                            this.uploadContent[i]['city'] = this.uploadContent[i]['Location_Tỉnh/Thành Phố'];
                            delete this.uploadContent[i]['Location_Tỉnh/Thành Phố'];
                        }
                        if ('QUẬN/HUYỆN/THỊ XÃ' in this.uploadContent[i]) {
                            this.uploadContent[i]['state_province'] = this.uploadContent[i]['QUẬN/HUYỆN/THỊ XÃ'];
                            delete this.uploadContent[i]['QUẬN/HUYỆN/THỊ XÃ'];
                        }
                        if ('Location_Mã định danh trạm' in this.uploadContent[i]) {
                            this.uploadContent[i]['location_system_code'] = this.uploadContent[i]['Location_Mã định danh trạm'];
                            delete this.uploadContent[i]['Location_Mã định danh trạm'];
                        }
                        if ('Owner_name' in this.uploadContent[i]) {
                            this.uploadContent[i]['full_name'] = this.uploadContent[i]['Owner_name'];
                            delete this.uploadContent[i]['Owner_name'];
                        }
                        if ('Location_KINH ĐỘ/VĨ ĐỘ' in this.uploadContent[i]) {
                            if(this.uploadContent[i]['Location_KINH ĐỘ/VĨ ĐỘ'] != undefined && this.uploadContent[i]['Location_KINH ĐỘ/VĨ ĐỘ'] != null) {
                                let geo = this.uploadContent[i]['Location_KINH ĐỘ/VĨ ĐỘ'].split(",")
                                this.uploadContent[i]['positionPoints'] = {
                                    x : [],
                                    y : [],
                                    z : []
                                }
                                if(geo.length > 1) {
                                    let idData = uuid.newUuid()
                                    this.uploadContent[i]['positionPoints'].y.push(
                                        {
                                            coor : geo[1],
                                            id : idData
                                        }
                                    )
                                    this.uploadContent[i]['positionPoints'].x.push(
                                        {
                                            coor : geo[0],
                                            id : idData
                                        } 
                                    )
                                    this.uploadContent[i]['positionPoints'].z.push(
                                        {
                                            coor : '',
                                            id : idData
                                        } 
                                    )
                                }
                            } else {
                                this.uploadContent[i]['positionPoints'] = {
                                    x : [],
                                    y : [],
                                    z : []
                                }
                            }
                            delete this.uploadContent[i]['Location_KINH ĐỘ/VĨ ĐỘ']
                        } else { 
                            this.uploadContent[i]['positionPoints'] = {
                                x : [],
                                y : [],
                                z : []
                            }
                            delete this.uploadContent[i]['Location_KINH ĐỘ/VĨ ĐỘ']
                        }
                        if ('Phường/Xã' in this.uploadContent[i]) {
                            if(this.uploadContent[i]['address'] != undefined && this.uploadContent[i]['address'] != null) {
                                this.uploadContent[i]['address'] = this.uploadContent[i]['address'] + this.uploadContent[i]['Phường/Xã']
                            } else {
                                this.uploadContent[i]['address'] = this.uploadContent[i]['Phường/Xã']
                            }
                            delete this.uploadContent[i]['Phường/Xã'];
                        }
                        if ('Đường/Xóm…' in this.uploadContent[i]) {
                            if(this.uploadContent[i]['address'] != undefined && this.uploadContent[i]['address'] != null) {
                                if(this.uploadContent[i]['address'] != '') {
                                    this.uploadContent[i]['address'] = this.uploadContent[i]['Đường/Xóm…'] + ',' + this.uploadContent[i]['address']
                                } else {
                                    this.uploadContent[i]['address'] = this.uploadContent[i]['address'] + this.uploadContent[i]['Đường/Xóm…']
                                }
                            } else {
                                this.uploadContent[i]['address'] = ''
                            }
                            delete this.uploadContent[i]['Đường/Xóm…'];
                        }              
                    }
                    let data = locationAPI.addLocationByOwnerFullName(this.uploadContent)
                    if(data == null || data == undefined) {
                        this.$message.error("Upload data fail")
                    } else {
                        this.$message.success("Upload data successful")
                    }
                } else {
                    this.$message.error("File empty")
                }
            } catch(e) {
                this.$message.error("Error")
            }
        }
    }
}
</script>
<style lang="scss" scoped>
h1 {
    font-size: 24px; /* Cỡ chữ */
    font-weight: bold; /* Chữ đậm */
    color: #413939; /* Màu chữ */
    text-align: center; /* Căn giữa */
    margin-bottom: 10px; /* Khoảng cách phía dưới */
    white-space: pre-line; /* Hỗ trợ xuống dòng */
}


.chart-wrapper {
  width: 150px;
  height: 50px;
  margin-left: 100px;
  margin-top: 150px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.chartTitle2 {
  font-family: Arial, Helvetica, sans-serif !important;
  font-size: 1.4em;
  color: #333;
  text-align: center;
}
</style>