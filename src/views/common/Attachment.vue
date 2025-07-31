<template>
    <div>
        <br/>
        <br/>
        <span class="bolder">Attachments
            <span class="last-right-parent">
                <i @click="downloadItem(rowCurrent)" class="fa fa-download mgr-10 pointer"></i>
                <i @click="openFile()" class="fa-solid fa-folder-open mgr-10 pointer"></i>
                <i @click="upload()" class="fa-solid fa-plus mgr-10 pointer"></i>
                <input type="file" ref="fileInput" style="display:none" @change="handleFileSelect">
                <a style="display : none" id="download"></a>
                <i @click="deleteItem(rowCurrent)" class="fa-solid fa-trash mgr-10 pointer"></i>
            </span>
        </span>
        <el-divider></el-divider>
        <div class="border-main color-main" :style="{height: height, overflow: 'auto'}">
            <table class="table-attachment">
                <tr class="tr-hover" v-for="(item, index) in rowData" :key="index">
                    <td @dblclick="openFile()" @click="selectRow(index)" ref="table">
                        <i class="fa-solid fa-file"></i> {{ item.name }} 
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import { mapState } from 'vuex'
import * as fileAPI from '@/api/fileAPI/fileUpload.js'
import mime from 'mime';
export default {
    name: 'attachments',
    props: {
        title : String,
        height : String,
        attachment_ : [],
        fileUrl : [],
        deleteList : [],
        dataParent : Object
    },
    data() {
        return {
            attachment : "",
            rowCurrent : "",
            rowData : [],
            fileURL : []
        }
    },
    beforeMount() {
    },
    watch : {
        rowData : {
            deep : true,
            immediate : true,
            handler() {
                this.$emit('data-attachment', this.rowData, this.fileURL)
            }
        },
        attachment_ : {
            deep : true,
            immediate : true,
            handler() {
                this.rowData = this.attachment_
            }
        },
        fileUrl : {
            deep : true,
            immediate : true,
            handler() {
                this.fileURL = this.fileUrl
            }
        }
    },
    computed: {
        ...mapState(['selectedLocation', 'selectedAsset'])
    },
    methods: {
        async deleteItem(row) {
            if(row !== '') {
                await this.$confirm('This will permanently delete the file. Continue?', 'Warning', {
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                })
                .then(async () => {
                    if(row !== '') {
                        if(this.rowData[row].upload != 'new') {
                            this.deleteList.push(this.rowData[row])
                        }
                        this.rowData.splice(row, 1)
                        this.fileURL.splice(row, 1)
                    }
                    this.rowCurrent = ""
                })
            }
        },
        selectRow(x) {
            this.$refs['table'].forEach((element) => {
                element.style.backgroundColor = 'rgba(0, 0, 0, 0)',
                element.style.color = 'black'
            })
            let ref = this.$refs['table'][x]
            let myDivObjBgColor = window.getComputedStyle(ref).backgroundColor;
            if(myDivObjBgColor.toString() === 'rgba(0, 0, 0, 0)') {
                ref.style.backgroundColor = '#012596',
                ref.style.color = 'white'
                this.rowCurrent = x
            } else {
                ref.style.backgroundColor = 'rgba(0, 0, 0, 0)',
                ref.style.color = 'black'
                this.rowCurrent = ''
            }
        },
        async upload() {
            this.$refs.fileInput.click();
        },
        async openFile() {
            if(this.rowCurrent !== '') {
                let fileName = this.rowData[this.rowCurrent].name
                let extention_arr = this.rowData[this.rowCurrent].name.split(".")
                let extention = extention_arr[extention_arr.length -1].toLowerCase()
                if(await this.isIMage(fileName) === true) {
                    await this.launchFile()
                } else if(await this.isVideo(fileName) === true) {
                    await this.launchFile()
                } else if(["doc", "docx"].includes(extention) === true) {
                    await this.launchFile()
                } else if(extention === 'xlsx' || extention === 'xls' || extention === 'csv') {
                    await this.launchFile()
                } else if(extention === 'pptx') {
                    await this.launchFile()
                } else if(extention === 'pdf') {
                    await this.launchFile()
                }
                else {
                    this.$message({
                        type: 'warning',
                        message: "File extension don't be supported"
                    })
                }
            }
        },
        async launchFile() {
            if(this.fileURL[this.rowCurrent] != -1) {
                window.open(this.fileURL[this.rowCurrent])
            } else {
                try {
                    const mimeType = mime.getType(this.rowData[this.rowCurrent].name);
                    let dataFile = await fileAPI.download(this.rowData[this.rowCurrent].name, this.dataParent.name, this.dataParent.id)
                    const byteCharacters = atob(dataFile);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType  });
                    const url = window.URL.createObjectURL(blob);
                    window.open(url)
                    this.fileURL[this.rowCurrent] = url
                } catch(e) {
                    this.$message.error("Some error occurred")
                }
            }
        },
        async getFileExtension(fileName){
            var  fileExtension;
            fileExtension = fileName.replace(/^.*\./, '');
            return fileExtension;
        },
        async isIMage(fileName){
            var fileExt = await this.getFileExtension(fileName);
            var imagesExtension = ["png", "jpg", "jpeg"];
            return imagesExtension.includes(fileExt.toLowerCase())
        },
        async isVideo(filename) {
            var ext = await this.getFileExtension(filename);
            switch (ext.toLowerCase()) {
                case 'm4v':
                case 'avi':
                case 'mpg':
                case 'mp4':
                // etc
                return true;
            }
            return false;
        },
        handleClose() {
            this.dialogVisible = false
        },
        async downloadItem() {
            try {
                const a = document.getElementById('download');
                a.href = this.fileURL[this.rowCurrent];
                a.download = this.fileURL[this.rowCurrent];
                a.click();
                this.$message({
                        type: 'success',
                        message: "Download file completed"
                    })
            } catch (e) {
                this.$message({
                        type: 'error',
                        message: "Download failed"
                    })
                    console.log(e)
            }
        },
        async handleFileSelect(event) {
            const file = event.target.files[0];
            file.upload = "new"
            if(this.rowData.map(element => element.name).includes(file.name)) {
                this.$message({
                    type: 'error',
                    message: "File upload have the same name"
                })
            } else {
                let fileURLTemp = URL.createObjectURL(file);
                this.rowData.push(file)
                this.fileURL.push(fileURLTemp)
            }
            this.$refs.fileInput.value = '';
        }
        
    }
}
</script>
<style lang="scss" scoped>
.last-right-parent {
    position: relative;
    float: right;
}
.table-attachment {
    width: 100%;
    table-layout:fixed;
}
.border-main {
    border: 1px solid #9b9797!important;
}
.color-main {
    background-color: white;
    color: black;
    cursor: pointer;
}
.mgr-10 {
    margin-left: 10px;
}
</style>