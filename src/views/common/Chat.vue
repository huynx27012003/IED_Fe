<template>
  <div @click="(event) => {hideSearch(event); hideOptionGroup();}" class="chat_all" style="display: flex;">
    <div style="width: 45%; height: 500px;">
        <div style="display: flex; height: 28px;">
            <el-input ref="searchData" @keyup.enter.native="searchGroup" placeholder="Search name or email" style="width: calc(100% - 10px - 90px) !important;" size="mini" v-model="search" class="custom-input">
                <div style="cursor: pointer;" @click="searchGroup" slot='prepend'>
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
            </el-input>
            <div style="margin-left: 10px;">
                <el-dropdown @click="addGroup" @command="handleCommand" size="mini" split-button type="primary">
                    <i class="fa-solid fa-plus"></i>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="user_list"><i class="fa-solid fa-list-check"></i> User list</el-dropdown-item>
                            <el-dropdown-item></el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
        <div>
            <div ref="chatBubble" style="display: none;" class="chat-bubble">
                <div class="chat-bubble-content">
                    <p v-if="dataUserList.length == 0">No user found</p>
                    <div v-if="dataUserList.length !== 0">
                        <table>
                            <tr v-for="(item, index) in dataUserList" :key="index" style="white-space: nowrap; height: 50px; cursor: pointer;" class="userHover">
                                <td @dblclick="dbClickUser(item)">
                                    <i style="margin-right: 20px" class="fa-solid fa-user-tie"></i> {{ item.username }}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div style="overflow-y: auto; overflow-x: hidden; height: calc(100% - 30px);" @scroll="handleScroll">
            <table style="margin-top: 20px; overflow: auto;" class="group_chat_table">
                <tr class="groupTr"  @contextmenu.prevent="clickOptionGroup($event, item)" @click="chosenChat(item, index)" v-for="(item, index) in groupList" :key="index">
                    <div style="display: flex; height: inherit; width: inherit;">
                        <div style="display: flex; height: inherit; justify-content: center; align-items: center;">
                            <div class="row_icon">
                                <i class="fa-solid fa-square-envelope"></i>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; margin-left: 10px; width: 100%;">
                            <div style="width: 100%;">
                                <div style="display: flex; width: 100%;">
                                    <div style="width: 100%;">
                                        <div v-if="item.createdBy != $store.state.user.user_id && item.type == 'single'" style="float: left; max-width: 180px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important; color: black; font-weight: 300;">{{item.createdName}}</div>
                                        <div v-else style="float: left; max-width: 180px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important; color: black; font-weight: 300;">{{item.groupName}}</div>
                                        <div style="float: right; margin-right: 3px; color: #C0C0C0; max-width: 180px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important;">{{ item.lastMessageAtFormatter }}</div>
                                    </div>
                                </div>
                                <div v-if="item.type == 'single'">
                                    <div v-if="item.lastMessageReceiveMember == undefined" style="margin-top: 3px; color: #C0C0C0; max-width: 300px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important; ">
                                        {{ item.lastMessage }}
                                    </div>
                                    <div v-else-if="item.lastMessageCreatedBy == $store.state.user.user_id" style="margin-top: 3px; color: #C0C0C0; max-width: 300px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important; ">
                                        {{ item.lastMessage }}
                                    </div>
                                    <div v-else-if="item.lastMessageReceiveMember !== null && item.lastMessageReceiveMember.includes($store.state.user.user_id)" style="margin-top: 3px; color: #C0C0C0; max-width: 300px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important; ">
                                        {{ item.lastMessage }}
                                    </div>
                                    <div v-else style="margin-top: 3px; max-width: 300px; overflow: hidden; white-space: nowrap ;text-overflow: ellipsis !important; font-weight: bold; ">
                                        <i style="font-size: 8px;" class="fa-solid fa-circle"></i> {{ item.lastMessage }}
                                    </div>
                                </div>
                                <div v-else>

                                </div>
                            </div>
                        </div>
                    </div>
                </tr>
            </table>
        </div>
    </div>
    <div style="width: 55%; height: 500px">
        <div style="width: 100%; height: 50px; background-color: rgb(30, 48, 80); color: white; display: flex; align-items: center; font-weight: 600; text-transform: uppercase; overflow: hidden; ">
            <div style="margin-left: 20px; white-space: nowrap; max-width: 300px; text-overflow: ellipsis; overflow: hidden">
                {{ title }}
            </div>
            <div style="margin-left: auto; margin-right: 20px;">
                <div @click="openDropdown()" class="extend" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                    <el-dropdown ref="dropDownOption" @command="handleCommandOption" trigger="manual">
                        <i style="font-size: 20px; color: white;" class="fa-solid fa-ellipsis-vertical"></i>
                        <el-dropdown-menu slot="dropdown">
                            <template>
                                <el-dropdown-item command="member_list">
                                    <i style="font-size: 15px;" class="fa-solid fa-address-book"></i> 
                                    Member 
                                </el-dropdown-item>
                                <el-dropdown-item command="rename">
                                    <i style="font-size: 15px;" class="fa-solid fa-pen-to-square"></i>
                                    Rename
                                </el-dropdown-item>
                                <el-dropdown-item command="delete_chat">
                                    <i style="font-size: 15px;" class="fa-solid fa-trash"></i>
                                    Delete
                                </el-dropdown-item>
                            </template>
                        </el-dropdown-menu>
                    </el-dropdown>
                </div>
            </div>
        </div>
        <div style="width: 100%; height: calc(100% - 120px);">
            <div @scroll="scrollChat" ref="chatContainer" style="width: calc(100% - 2px); height: 100%; overflow-y: scroll;" class="text_area text_area no-scrollbar">
                <table style="width: 100%;">
                    <tr v-for="(item, index) in chatContent" :key="index" style="width: 100%;">
                        <td v-if="item.type == 'text' && item.createdBy != $store.state.user.user_id" style="direction: ltr; text-align: left;">
                            <div style="display: flex; align-items: center;">
                                <i class="fa-solid fa-circle-user" style="margin-right: 5px;"></i>
                                <div style="font-size: 10px;">{{item.senderName}}</div>
                            </div>
                            <div class="content-bubble-other">
                                {{ item.content }}
                            </div>
                            <div style="font-size: 10px;">
                                {{ item.createdOnFormatter }}
                            </div>
                        </td>
                        <td v-else-if="item.type == 'text' && item.createdBy == $store.state.user.user_id" style="direction: rtl; text-align: right;">
                            <div style="display: flex; align-items: center;">
                                <div style="font-size: 10px;">You</div>
                                <i class="fa-solid fa-circle-user" style="margin-right: 5px; color: green;"></i>
                            </div>
                            <div class="content-bubble" style="direction: ltr">
                                {{ item.content }}
                            </div>
                            <div style="font-size: 10px;">
                                {{ item.createdOnFormatter }}
                            </div>
                        </td>
                        <td v-else-if="item.type == 'file' && item.createdBy == $store.state.user.user_id" style="direction: rtl; text-align: right;">
                            <div style="display: flex; align-items: center;">
                                <i class="fa-solid fa-circle-user" style="margin-right: 5px;"></i>
                                <div style="font-size: 10px;">You</div>
                            </div>
                            <div style="font-size: 10px;">
                                {{ item.createdOnFormatter }}
                            </div>
                        </td>
                        <td v-else-if="item.type == 'file' && item.createdBy != $store.state.user.user_id" style="direction: ltr; text-align: left;">
                            <div style="display: flex; align-items: center;">
                                <i class="fa-solid fa-circle-user" style="margin-right: 5px;"></i>
                                <div style="font-size: 10px;">{{item.senderName}}</div>
                            </div>
                            <div style="font-size: 10px;">
                                {{ item.createdOnFormatter }}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>  
        </div>
        <div style="height: 70px; width:100%; display: flex; justify-content: center; align-items: center;" class="input_area">
            <el-input v-model="messageData" @keyup.enter.native="pushMessage" placeholder="Aa..." size="medium">
                <div @click="loadAttachment" style="cursor: pointer;" slot='append'>
                    <i class="fa-solid fa-paperclip"></i>
                </div>
            </el-input>
            <el-button @click="pushMessage" style="margin-left: 20px;" type="primary" size="medium">
                <i class="fa-solid fa-circle-arrow-right"></i>
            </el-button>
        </div>
    </div>
    <div @click.stop="deleteGroupData" ref="optionGroup" style="position: absolute; display: none; background-color: white; cursor: pointer;">
        <table style="border: 2px solid #C0C0C0;">
            <tr>
                <td style="font-size: 12px;">
                    <i style="color: red" class="fa-solid fa-trash"></i>
                    Delete
                </td>
            </tr>
        </table>
    </div>

    <el-dialog
        :visible.sync = 'addChatSign'
        :title="titleGroup"
        align-center
        :before-close="handleCloseAddingChat"
        draggable
        width="500px"
        :modal="false"
    >
        <el-input v-model="groupAdding"></el-input>
        <span slot="footer" class="dialog-footer">
            <el-button type="danger" @click="handleCloseAddingChat()" size="small">Cancel</el-button>
            <el-button type="primary" @click="handleConfirmAddingChat()" size="small">Confirm</el-button>
        </span>
    </el-dialog>
    <el-dialog
        :visible.sync = 'addMemberSign'
        :title="titleMember"
        align-center
        :before-close="handleCloseMemberChat"
        draggable
        width="1000px"
        :modal="false"
        custom-class="custom-member"
    >
        <div style="height: 50px;">
            <el-button type="primary" @click="handleConfirmAddingMember()" size="small">
                <i class="fa-solid fa-user-plus"></i> Add
            </el-button>
            <el-select 
                size="small" 
                placeholder="Search member..." 
                style="width: 300px; margin-left: 20px;"
                multiple
                filterable
                remote
                reserve-keyword
                collapse-tags
                :remote-method="onSearchMember"
                @keyup.enter.native="triggerRemote"
                v-model="meberDataSelect"
                >
                <el-option
                    v-for="(item,index) in memberSearchData"
                    :key="index"
                    :label="item.username"
                    :value="item.id"
                >
                </el-option>
            </el-select>
            <el-button style="margin-left: 3px;" type="primary" size="small" @click="searchingMember(this.memberSearch)">
                <i class="fa-solid fa-magnifying-glass"></i>
            </el-button>
        </div>
        <div style="width: 100%; height: 450px; overflow: auto;">
            <table class="tableMember" style="width: 100%;border: 1px solid black;">
                <thead style="height: 50px;">
                    <th style="width: 100px; padding-left: 20px;">STT</th>
                    <th style="width: 400px; padding-left: 20px;"> <i class="fa-solid fa-signature"></i> Name</th>
                    <th style="width: 400px; padding-left: 20px;"> <i class="fa-solid fa-envelope-open-text"></i> Email</th>
                    <th style="width: 100px; text-align: center;"> <i class="fa-solid fa-gear"></i> Option</th>
                </thead>
                <tbody>
                    <tr v-for="(item, index ) in memberListData" :key="index">
                        <td>
                            <div style="display: flex; justify-content: center;align-items: center;">
                                <strong>{{index + 1}}</strong>
                                <div style="width: 30px; height: 30px; margin-left: 10px;display: flex; justify-content: center;align-items: center;">
                                    <i class="fa-solid fa-user-tag" style="font-size: 20px;"></i>
                                </div>
                            </div>
                        </td>
                        <td>{{ item.username }}</td>
                        <td>{{ item.email }}</td>
                        <td style="text-align: center;">
                            <i @click="deleteMember(index)" class="fa-solid fa-trash" style="color: red;"></i>
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>
        <span slot="footer" class="dialog-footer">
            <el-button type="danger" @click="handleCloseMemberChat()" size="small">Cancel</el-button>
        </span>
    </el-dialog>

  </div>
</template>

<script>
/* eslint-disable */
import * as messageAPI from '@/api/messageAPI/messageAPI'
import uuid from '@/utils/uuid';

export default {
    data() {
        return {
            meberDataSelect : '',
            memberSearch : '',
            memberSearchData : [],
            search : '',
            messageData : '',
            querySnapshot : '',
            addChatSign : false,
            addMemberSign : false,
            titleMember : "Member List",
            titleGroup : 'Add Group',
            dataUserList : [],
            groupList : [],
            sl : 10,
            current : 0,
            title : '',
            chatContent : [],
            currentContent : 0,
            currentGroup : {},
            groupAdding : '',
            currentDelete : '',
            memberListData : [],
        }
    },
    methods: {
        async resetData() {
            this.title = '';
            this.current = 0
            this.chatContent = []
            this.currentContent = 0
            this.currentGroup = {}
            this.groupList = []
            this.messageData = ''
        },
        async searchGroup() {
            if(this.search !== '') {
                this.dataUserList = []
                const bubbleChat = document.querySelector('.chat-bubble');
                bubbleChat.style.display = ''
                if (bubbleChat.classList.contains('fade-out')) {
                    bubbleChat.classList.remove('fade-out');
                }
                let data = await messageAPI.getUserByNameAndEmail(this.search)
                if(data === undefined) {
                    this.$message.error("Cannot find user")
                    bubbleChat.style.display = 'none'
                } else {
                    if(data.length === 0) {
                        this.dataUserList = []
                        bubbleChat.style.height = ''
                        bubbleChat.classList.add('fade-out');
                        setTimeout(() => {
                            bubbleChat.style.display = 'none'; // Ẩn phần tử hoàn toàn sau 2 giây
                        }, 3000); // Thời gian trễ là 2000ms tương ứng với 2 giây
                    } else {
                        this.dataUserList = data
                        bubbleChat.style.height = '300px'
                        
                    }
                }
            }
        },
        async hideSearch(event) {
            if(event != undefined && event.target != undefined) {
                const bubbleChat = document.querySelector('.chat-bubble');
                if(bubbleChat != null && bubbleChat != undefined && bubbleChat.style.display != 'none') {
                    if (!bubbleChat.contains(event.target)) {
                        bubbleChat.style.display = 'none'
                    }
                }
            }
        },
        async pushMessage() {
            if(this.messageData != '') {
                if(this.currentGroup.id != null) {
                    let data = {
                        id : uuid.newUuid(),
                        groupId : this.currentGroup.id,
                        content : JSON.parse(JSON.stringify(this.messageData)),
                        senderId : this.$store.state.user.user_id,
                        senderName : this.$store.state.user.name,
                        status : 'sending',
                        type : 'text'
                    }
                    this.messageData = ''
                    let uploadMessage = await messageAPI.insertMessage(data)
                    if(uploadMessage == null) {
                        this.$message.error("Cannot send message")
                    } else {
                        uploadMessage.createdOnFormatter = await this.formatDate(uploadMessage.createdOn)
                        this.chatContent.push(uploadMessage)
                        this.$nextTick(async () => {
                            const container = this.$refs.chatContainer;
                            if (container) {
                                container.scrollTop = container.scrollHeight;
                            }
                            for (const e of this.groupList) {
                                if (e.id == this.currentGroup.id) {
                                    e.lastMessage = uploadMessage.content;
                                    e.lastMessageAt = uploadMessage.createdOn;
                                    e.createdOnFormatter = await this.formatDate(e.createdOn);
                                    break; // Break sẽ hoạt động ở đây
                                }
                            }
                        });
                    }
                } else {
                    this.$message.error("Group must be chosen")
                }
            }
        },
        async loadData() {
            try {
                const inputElement = document.querySelector('.custom-input');
                const dialogChat = document.querySelector('.el-dialog-chat');
                const body = dialogChat.querySelector('.el-dialog__body');
                const header = dialogChat.querySelector('.el-dialog__header');
                const rect = inputElement.getBoundingClientRect();
                const rect_body = body.getBoundingClientRect();
                const rect_header = header.getBoundingClientRect();
                const bubbleChat = document.querySelector('.chat-bubble');
                if(bubbleChat != undefined && bubbleChat.style != undefined) {
                    bubbleChat.style.position = 'absolute';
                    bubbleChat.style.top = `${rect.bottom - rect_body.top + rect_header.height + 15}px`; // Tọa độ Y so với phần tử cha
                    bubbleChat.style.left = `${rect.width / 3}px`; // Dịch sang trái 20px so với vị trí trong phần tử cha
                }
                
                var groupListData = await messageAPI.getGroupList(0, this.sl)
                if(groupListData != null && groupListData.length != 0) {
                    this.current = 0
                    for(let i in groupListData) {
                        if(groupListData[i].lastMessageAt != null) {
                            groupListData[i].lastMessageAtFormatter = await this.formatDate(groupListData[i].lastMessageAt)
                        }
                    }
                }
                this.groupList = groupListData
            } catch(e) {
                this.$message.error("Some error to load message")
            }
        },
        async addGroup() {
            this.titleGroup = "Add Group"
            this.addChatSign = true
        },
        async handleCloseAddingChat() {
            this.addChatSign = false
        },
        async handleCloseMemberChat() {
            this.addMemberSign = false
        },
        async handleConfirmAddingChat() {
            if(this.titleGroup == "Add Group") {
                if(this.groupAdding != '') {
                    const groupId = uuid.newUuid();
                    let groupData = {
                        groupName: this.groupAdding,       // Tên nhóm
                        createdBy: this.$store.state.user.user_id,         // ID người tạo
                        createdOn: new Date(),          // Thời gian tạo
                        lastMessageReceiveMember: [],
                        lastMessageCreatedBy : null,
                        member: [this.$store.state.user.user_id],  // Danh sách thành viên
                        lastMessageAt : '',
                        lastMessage : '',
                        type : 'group',
                        id : groupId
                    }
                    try {
                        let newChat = await messageAPI.insertGroupList(groupData)
                        if(newChat != null && newChat != undefined) {
                            this.$message.success("Add group success")
                            this.$nextTick(() => {
                                this.groupList.unshift(newChat)
                                this.chosenChat(newChat)   
                            })
                            this.addChatSign = false
                        }
                    } catch(e) {
                        this.$message.error("Some error occur")
                    }
                } else {
                    this.$message.error("Name group cannot be null or empty")
                }
            } else if(this.titleGroup == "Rename Group") {
                let nameGroup = JSON.parse(JSON.stringify(this.currentGroup.groupName))
                this.currentGroup.groupName = this.groupAdding
                try {
                    if(this.groupAdding == '') {
                        this.currentGroup.groupName = nameGroup
                        this.$message.error("Name cannot empty")
                    } else {
                        let data = await messageAPI.renameGroup(this.currentGroup.id, this.groupAdding)
                        if(data != null && data != undefined) {
                            this.currentGroup.groupName = this.groupAdding
                            this.title = this.groupAdding
                        } else {
                            this.currentGroup.groupName = nameGroup
                        }
                    }
                    this.addChatSign = false
                } catch(e) {
                    this.currentGroup.groupName = nameGroup
                    this.$message.error("Cannot rename group")
                }
            }
        },
        async handleCommand(command) {
            console.log(command)
        },
        async dbClickUser(data) {
            try {
                let groupListFilter = this.groupList.filter(e => e.type == 'single' && e.member.length == 2 && e.member.includes(data.id))
                if(groupListFilter.length != 0) {
                    const bubbleChat = document.querySelector('.chat-bubble');
                    bubbleChat.style.display = 'none'
                    this.$nextTick(() => {
                        this.chosenChat(groupListFilter[0])
                        this.dataUserList = []
                        this.search = ''
                    })
                } else {
                    let groupArr = await messageAPI.getSingleGroupListByTypeAndId("Single", data.id)
                    if(groupArr == null || groupArr.length == 0) {
                        const groupId = uuid.newUuid();
                        let groupData = {
                            groupName: data.username,       // Tên nhóm
                            createdBy: this.$store.state.user.user_id,         // ID người tạo
                            createdOn: new Date(),          // Thời gian tạo
                            member: [this.$store.state.user.user_id,data.id],  // Danh sách thành viên
                            lastMessageReceiveMember: [],
                            lastMessageCreatedBy : null,
                            lastMessageAt : '',
                            lastMessage : '',
                            type : 'single',
                            id : groupId
                        }
                        let newChat = await messageAPI.insertGroupList(groupData)
                        if(newChat != null && newChat != undefined) {
                            this.$message.success("Add group success")
                            const bubbleChat = document.querySelector('.chat-bubble');
                            bubbleChat.style.display = 'none'
                            this.$nextTick(() => {
                                this.groupList.unshift(newChat)
                                this.chosenChat(newChat)
                                this.dataUserList = []
                                this.search = ''
                            })
                        }
                    } else {
                        const bubbleChat = document.querySelector('.chat-bubble');
                        bubbleChat.style.display = 'none'
                        this.$nextTick(() => {
                            this.groupList.unshift(groupArr[0])
                            this.chosenChat(groupArr[0])
                            this.dataUserList = []
                            this.search = ''
                        })
                    }
                }
            } catch (e) {
                console.log(e)
                this.$message.error("Add group failed")
            }
        },
        async formatDate(dateStr) {
            let dateObj = new Date(dateStr);
            const formattedDate = dateObj.toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
            return formattedDate
        },
        async chosenChat(item, index) {
            this.currentGroup = item
            let signUnread = []
            if(this.currentGroup.lastMessageReceiveMember == null || this.currentGroup.lastMessageReceiveMember == undefined) {
                this.groupList[index].lastMessageReceiveMember = []
            } else {
                signUnread = JSON.parse(JSON.stringify(this.currentGroup.lastMessageReceiveMember))
            }
            if(index != null && index != undefined) {
                if(!this.groupList[index].lastMessageReceiveMember.includes(this.$store.state.user.user_id) && this.groupList[index].lastMessageCreatedBy != this.$store.state.user.user_id) {
                    this.groupList[index].lastMessageReceiveMember.push(this.$store.state.user.user_id)
                }
                let elements = document.getElementsByClassName('groupTr')
                if (elements && elements.length > 0) {
                    for (let i = 0; i < elements.length; i++) {
                        if (i === index) { // So sánh chỉ mục chính xác
                            elements[i].style.backgroundColor = 'rgba(56, 167, 255, 0.10)';
                        } else {
                            elements[i].style.backgroundColor = 'white';
                        }
                    }
                }
            }
            if(item.createdBy != this.$store.state.user.user_id && item.type == 'single') {
                this.title = item.createdName
            } else {
                this.title = item.groupName
            }
            try {
                if(signUnread.includes(this.$store.state.user.user_id) || item.lastMessageCreatedBy == this.$store.state.user.user_id) {
                    let data = await messageAPI.getAllMessageByUnread(item.id)
                    if(data == null || data == undefined || data.length == 0) {
                        data = await messageAPI.getMessage(item.id, 0, this.sl)
                        if(data == null || data == undefined) {
                            for(let i in data) {
                                if(data[i].createdOn != null) {
                                    data[i].createdOnFormatter = await this.formatDate(data[i].createdOn)
                                }
                            }
                        }
                    }
                    this.chatContent = JSON.parse(JSON.stringify(data.reverse()))
                } else {
                    let data = await messageAPI.getMessage(item.id, 0, this.sl)
                    if(data == null || data == undefined) {
                        for(let i in data) {
                            if(data[i].createdOn != null) {
                                data[i].createdOnFormatter = await this.formatDate(data[i].createdOn)
                            }
                        }
                    }
                    this.chatContent = JSON.parse(JSON.stringify(data.reverse()))
                    Promise.resolve().then(async () => {
                        await messageAPI.markAsSeenArr(this.chatContent.map(e => e.id))
                        await messageAPI.insertGroupList(this.currentGroup)
                    });
                }
            } catch(e) {
                console.log(e)
                this.$message.error("Cannot load message")
            }
        },
        async handleScroll(event) {
            const element = event.target;
            if (element.scrollHeight - element.scrollTop === element.clientHeight) {
                try {
                    let newCurrent = this.current + this.sl
                    let data = await messageAPI.getGroupList(newCurrent, this.sl)
                    if(data != null && data != undefined && data.length != 0) {
                        for(let i in data) {
                            if(data[i].lastMessageAt != null) {
                                data[i].lastMessageAtFormatter = await this.formatDate(data[i].lastMessageAt)
                            }
                        }
                        this.groupList.push(...data)
                        this.current = newCurrent
                    }
                } catch(e) {
                    this.$message.error("Cannot load message")
                }
            }
        },
        async loadNewMessage(data) {
            if(data != null) {
                let newMessage = await messageAPI.getMessageById(data.id, data.groupId)
                if(newMessage != null) {
                    if(data.groupId == this.currentGroup.id) {
                        newMessage.createdOnFormatter = await this.formatDate(newMessage.createdOn)
                        const container = this.$refs.chatContainer;
                        if(container) {
                            if(container.scrollTop + container.clientHeight >= container.scrollHeight) {
                                this.chatContent.push(newMessage)
                                this.$nextTick(() => {
                                    container.scrollTop = container.scrollHeight;
                                });
                            } else {
                                this.chatContent.push(newMessage)
                            }
                            this.currentGroup.lastMessage = newMessage.content
                        }
                    } else {
                        for(let i in this.groupList) {
                            if(data.groupId == this.groupList[i].id) {
                                this.groupList[i].lastMessage = newMessage.content
                                this.groupList[i].lastMessageCreatedBy = null;
                                this.groupList[i].lastMessageReceiveMember = [];
                                const [movedElement] = this.groupList.splice(i, 1); // Xóa phần tử tại vị trí i
                                this.groupList.unshift(movedElement); // T
                            }
                            break
                        }
                    }
                }
            }
        },
        async scrollChat() {
            const container = this.$refs.chatContainer;
            if(container) {
                if(container.scrollTop === 0) {
                    try {
                        let data = await messageAPI.getMessage(this.currentGroup.id, this.chatContent.length, this.sl)
                        if(data != null) {
                            for(let i in data) {
                                if(data[i].createdOn != null) {
                                    data[i].createdOnFormatter = await this.formatDate(data[i].createdOn)
                                }
                            }
                            this.chatContent.unshift(...JSON.parse(JSON.stringify(data.reverse())))
                        }
                    } catch(e) {
                        this.$message.error("Some error occur")
                    }
                }
            }
        },
        async clickOptionGroup(event, item) {
            event.preventDefault();
            const y = event.clientY;
            const dialogChat = document.querySelector('.el-dialog-chat');
            const body = dialogChat.querySelector('.el-dialog__body');
            const header = dialogChat.querySelector('.el-dialog__header');
            const rect_body = body.getBoundingClientRect();
            const rect_header = header.getBoundingClientRect();
            const optionGroup = this.$refs.optionGroup;
            if(optionGroup != null && optionGroup != undefined) {
                optionGroup.style.left = `${150}px`;
                optionGroup.style.top = `${y - rect_body.top + rect_header.height}px`;
                optionGroup.style.display = ''
            }
            this.currentDelete = item
        },
        async hideOptionGroup() {
            const optionGroup = this.$refs.optionGroup;
            if(optionGroup != null && optionGroup != undefined) {
                if(optionGroup.style != undefined) {
                    optionGroup.style.display = 'none'
                    this.currentDelete = ''
                }
            }
        },
        async deleteGroupData() {
            if(this.currentDelete != '') {
                try {
                    let data = await messageAPI.deleteGroup(this.currentDelete.id)
                    let deleteGroup = JSON.parse(JSON.stringify(this.currentDelete))
                    if(data == true) {
                        await this.hideOptionGroup()
                        this.$message.success("Delete successful")
                        this.groupList = this.groupList.filter(e => e.id != deleteGroup.id)
                        if(this.currentGroup.id == deleteGroup.id) {
                            this.currentDelete = ''
                            this.chatContent = []
                            this.title = ''
                            this.currentGroup = {}
                        }
                    } else {
                        this.$message.error("Some error occur")
                    }
                } catch(e) {
                    this.$message.error("Some error occur")
                    console.log(e)
                }
            }
        },
        openDropdown() {
            if(this.currentGroup.id != undefined && this.currentGroup.type == 'group') {
                if(this.$refs.dropDownOption != null && this.$refs.dropDownOption != undefined) {
                    this.$refs.dropDownOption.handleClick();
                }
            }
        },
        async loadAttachment() {

        },
        async handleCommandOption(command) {
            switch (command) {
                case 'member_list':
                    await this.memberList()
                    break
                case 'rename':
                    await this.rename()
                    break
                case 'delete_chat':
                    await this.deleteChat()
                    break

            }
        },
        async memberList() {
            this.titleMember = "Member List"
            this.addMemberSign = true
            try {
                let data = await messageAPI.getMemberOfGroup(this.currentGroup.id)
                if(data == null || data == undefined) {
                    this.$message.error("Cannot load member")
                } else {
                    this.memberListData = data
                    this.$message.success("Load member successful")
                }
            } catch(e) {
                this.$message.error("Cannot load member")
            }
        },
        async rename() {
            this.titleGroup = "Rename Group"
            this.addChatSign = true
        },
        async deleteChat() {
            try {
                let groupId = this.currentGroup.id
                let data = await messageAPI.deleteGroup(groupId)
                console.log(data)
                if(data == null || data == undefined) {
                    this.$message.error("Cannot delete group")
                } else {
                    this.$message.success("Delete successful")
                    for(let i in this.groupList) {
                        if(this.groupList[i].id == this.currentGroup.id) {
                            this.groupList.splice(i, 1);
                            break
                        }
                    }
                    this.chatContent = []
                    this.currentGroup = {}
                }
            } catch(e) {
                console.log(e)
                this.$message.error("Cannot delete group")
            }
        },
        async onSearchMember(query) {
            this.memberSearch = query
        },
        async triggerRemote() {
            if (this.memberSearch.trim() !== "") {
                this.remoteMember(this.memberSearch); // Gọi remoteMember với từ khóa
            }
        },
        async remoteMember(query) {
            this.memberSearchData = await this.searchingMember(query)
        },
        async searchingMember(data) {
            if(data != '' && data != undefined) {
                try {
                    let dataMember = await messageAPI.getUserByNameAndEmail(data)
                    if(dataMember == null || dataMember == undefined) {
                        this.$message.error("Cannot search user")
                        return []
                    } else {
                        return dataMember;
                    }
                } catch(e) {
                    this.$message.error("Cannot search user")
                    return []
                }
            }
        },
        async handleConfirmAddingMember() {
            try {
                let group = await messageAPI.addMemberToGroup(this.currentGroup.id, this.meberDataSelect)
                if(group == null || group == undefined) {
                    this.$message.error("Cannot add member to list")
                } else {
                    this.$message.success("Add member successful")
                    this.currentGroup.member = group.member
                    try {
                        let member = await messageAPI.getMemberOfGroup(this.currentGroup.id)
                        if(member == null || member == undefined) {
                            this.$message.error("Cannot reload member")
                        } else {
                            this.memberListData = member
                        }
                    } catch(ex) {
                        this.$message.error("Cannot reload member")
                    }
                }
            } catch(e) {
                this.$message.error("Cannot add member to list")
            }
        },
        async deleteMember(index) {
            try {
                let id = this.memberListData[index].id;
                let rs = await messageAPI.deleteMember(this.currentGroup.id, id)
                if(rs == null || rs == undefined) {
                    this.$message.error("Cannot delete member")
                } else {
                    this.memberListData.splice(index, 1)
                    this.currentGroup.member = rs.member
                    this.$message.success("Delete successful")
                }
            } catch(e) {
                this.$message.error("Cannot delete member")
            }
        }
    }
}
</script>

<style scoped>
.tableMember th, .tableMember td {
    border: 1px solid #C0C0C0 !important;
}
.custom-input .el-input__inner {
    border: 1px solid #C0C0C0 !important;
}
.custom-input .el-input-group__prepend {
    padding: 0 10px !important;
    border-left: 1px solid #C0C0C0 !important;
    border-top: 1px solid #C0C0C0 !important;
    border-bottom: 1px solid #C0C0C0 !important;
}
.group_chat_table tr {
    cursor: pointer;
    height: 50px;
    width: 100%;
    /* background-color: red; */
}
.group_chat_table {
    width: 100%;
}

.group_chat_table tr:hover {
    background-color: rgba(56, 167, 255, 0.10);
}

.row_icon {
  display: flex;
  align-items: center; /* Căn giữa theo chiều dọc */
  justify-content: center; /* Căn giữa theo chiều ngang */
  height: 80%; /* Chiều cao bằng chiều cao của div cha */
  aspect-ratio: 1; /* Đảm bảo hình vuông với chiều rộng và chiều cao bằng nhau */
  background-color: rgb(30, 48, 80); /* Màu nền cho hình tròn */
  border-radius: 50%; /* Bo tròn để tạo hình tròn */
}

.row_icon i {
  font-size: 25px;
  color: white;
}

.text_area {
    border: 1px solid #C0C0C0 !important;
}

.custom_chat .el-input-group__append {
    padding: 0 10px !important;
}

.input_area {
}

.input .el-input__inner {
    border: none !important;
}
.extend:hover {
    background-color: white;
    cursor: pointer;
}
.extend:hover i {
    color: rgb(30, 48, 80) !important;
}
.chat-bubble {
    width: auto; /* Chiều rộng tự động mở rộng theo nội dung */
    min-width: 200px; /* Đảm bảo chiều rộng tối thiểu là 200px */
    background-color: white; /* Nền màu trắng */
    color: black; /* Màu chữ đen */
    padding: 15px;
    border-radius: 10px;
    font-size: 14px;
    text-align: center;
    position: relative;
    border: 1px solid #C0C0C0; /* Viền màu đen */
    overflow-y: visible; /* Giữ bubble-chat có thể mở rộng theo chiều dọc */
    max-height: 400px; /* Thêm giới hạn chiều cao nếu cần */
}

.chat-bubble-content {
    overflow-x: hidden; /* Ẩn cuộn ngang bên trong */
    overflow-y: auto; /* Cuộn nội dung nếu vượt quá chiều cao */
    max-height: 300px; /* Giới hạn chiều cao của nội dung để không tràn ra ngoài */
}

.chat-bubble::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 20%;
    transform: translateX(-50%);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 15px solid #C0C0C0; /* Màu của mũi tên là viền đen */
}

.chat-bubble::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 20%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 13px solid white; /* Nền trắng cho mũi tên */
    z-index: 1; /* Đặt nó nằm trên mũi tên đen */
}

.chat-bubble table, 
.chat-bubble table tr, 
.chat-bubble table td {
    border: 1px solid #C0C0C0; /* Màu của mũi tên là viền đen */
}

.no-scrollbar {
    scrollbar-width: none; /* Cho Firefox */
}

.no-scrollbar::-webkit-scrollbar {
    display: none; /* Cho Chrome, Safari và các trình duyệt WebKit-based */
}

.fade-out {
    transition: opacity 3s ease; /* Hiệu ứng chuyển đổi độ mờ trong 2 giây */
    opacity: 0; /* Đặt độ mờ của phần tử về 0 */
}

.userHover:hover {
    background-color: #012596;
    color: white;
}
.content-bubble {
    background-color: #0084ff; /* Màu xanh giống Messenger */
    color: white; /* Màu chữ trắng */
    padding: 10px 15px; /* Khoảng cách trong để tạo kiểu bầu dục */
    border-radius: 20px; /* Bo tròn để thành bong bóng */
    max-width: 75%; /* Giới hạn chiều rộng để giống bong bóng chat */
    margin: 5px 0; /* Khoảng cách giữa các bong bóng */
    word-wrap: break-word; /* Tự động xuống dòng nếu nội dung quá dài */
    width: fit-content;
}

.content-bubble-other {
    background-color: #e4e6eb;; /* Màu xanh giống Messenger */
    color: black; /* Màu chữ trắng */
    padding: 10px 15px; /* Khoảng cách trong để tạo kiểu bầu dục */
    border-radius: 20px; /* Bo tròn để thành bong bóng */
    max-width: 75%; /* Giới hạn chiều rộng để giống bong bóng chat */
    margin: 5px 0; /* Khoảng cách giữa các bong bóng */
    word-wrap: break-word; /* Tự động xuống dòng nếu nội dung quá dài */
    width: fit-content;
}
</style>
<style>
.custom-member .el-dialog__body {
    height: 500px !important;
}
</style>