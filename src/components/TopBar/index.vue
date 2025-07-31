<template>
  <div class="top-bar">
    <nav id="top-windows">
      <div class="left-bar">
        <div
          @click="$router.push({ name: 'HomeView' }).catch(() => {})"
          class="iconHover logo-container"
          style="user-select: none"
        >
          <img
            src="@/assets/images/IED.png"
            alt="Logo"
            style="
              height: 25px;
              width: auto;
              display: block;
              align-items: center;
              margin-top: 4px;
            "
          />
        </div>
      </div>

      <div class="center-bar" v-if="$store.state.isAuthenticated">
        <div
          class="search-container"
          :class="{ expanded: isExpanded }"
          @click="expandSearch"
        >
          <i class="fa fa-search search-icon"></i>
          <input
            ref="searchInput"
            :placeholder="isExpanded ? 'Type to start searching' : 'Search'"
            @blur="collapseSearch"
            v-model="searchText"
            @input="onInput"
            :class="{ expanded: isExpanded }"
          />

          <Teleport to="body">
            <ul
              v-if="isExpanded && searchText && suggestions.length"
              class="search-suggest"
              :style="searchSuggestStyle"
            >
              <li
                v-for="(item, index) in suggestions"
                :key="index"
                @mousedown.prevent="selectSuggestion(item)"
              >
                {{ item.type }}: {{ item.name }}
              </li>
            </ul>
          </Teleport>
        </div>
      </div>

      <div class="right-bar">
        <div
          class="iconHover"
          style="margin-right: 10px; color: white; font-size: 20px"
          v-if="$store.state.isAuthenticated"
        >
          <i class="fa fa-bell"></i>
        </div>

        <el-dropdown @command="handleCommand" trigger="click">
          <div
            class="iconHover"
            style="
              width: 45px;
              height: 38px;
              background-color: inherit;
              display: flex;
              align-items: center;
              justify-content: center;
              /* margin-right: 10px; */
              color: white;
              font-size: 20px;
            "
          >
            <i class="fa fa-cog"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="config">
                <i style="margin-right: 8px" class="fa fa-wrench"></i>
                Config Server
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown @command="handleCommand" trigger="click">
          <div
            class="iconHover"
            style="
              width: 45px;
              height: 38px;
              background-color: inherit;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20px;
            "
            v-if="$store.state.isAuthenticated"
          >
            <i class="fa fa-user"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="$store.state.isAuthenticated"
                command="logout"
              >
                <i class="fa fa-sign-out" style="margin-right: 8px"></i>
                Logout
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>

    <!-- Dialog cấu hình server -->
    <el-dialog
      v-model="dialogConfig"
      title="Config server address"
      width="400px"
    >
      <el-form :model="formConfig" label-width="80px">
        <el-form-item label="Domain">
          <el-input
            v-model="formConfig.domain"
            placeholder="https://domain.com/api/"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogConfig = false">Cancel</el-button>
          <el-button type="primary" @click="setServerAddr">Save</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { searchItems } from "@/api/index.js";
import { mapState } from "vuex";
import Cookies from "js-cookie";

export default {
  name: "TopBar",
  data() {
    return {
      isExpanded: false,
      searchText: "",
      suggestions: [],
      suggestPosition: { top: 0, left: 0, width: 0 },
      dialogConfig: false,
      formConfig: {
        domain: "",
      },
    };
  },
  computed: {
    ...mapState(["serverAddr", "user"]),
    searchSuggestStyle() {
      return {
        position: "fixed",
        top: this.suggestPosition.top + "px",
        left: this.suggestPosition.left + "px",
        width: this.suggestPosition.width + "px",
        zIndex: 3000,
      };
    },
    username() {
      return this.user?.username || "";
    },
  },
  mounted() {
    this.formConfig.domain = this.serverAddr;
    if (!this.user) {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        this.$store.commit("setUser", JSON.parse(localUser));
      }
    }
  },
  methods: {
    expandSearch() {
      this.isExpanded = true;
      this.$nextTick(() => {
        this.$refs.searchInput.focus();
        this.updateSuggestPosition();
      });
    },
    collapseSearch() {
      if (!this.searchText) {
        this.isExpanded = false;
      }
    },
    async onInput() {
      const keyword = this.searchText.trim();
      if (keyword) {
        try {
          const data = await searchItems(keyword);
          this.suggestions = data.slice(0, 10);
        } catch (err) {
          this.suggestions = [];
        }
      } else {
        this.suggestions = [];
      }
      this.updateSuggestPosition();
    },
    updateSuggestPosition() {
      const input = this.$refs.searchInput;
      if (input) {
        const rect = input.getBoundingClientRect();
        this.suggestPosition = {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        };
      }
    },
    selectSuggestion(item) {
      this.searchText = `${item.type}: ${item.name}`;
      this.suggestions = [];
      this.isExpanded = false;
      this.$router.push(`/${item.type}/${item.name}`).catch(() => {});
    },
    handleCommand(command) {
      if (command === "config") {
        this.dialogConfig = true;
        this.formConfig.domain = this.serverAddr;
      }
      if (command === "logout") {
        this.$store.commit("logout");
        Cookies.remove("token"); // Xóa token khỏi cookie
        this.$router.replace({ name: "login" });
        this.$message.success("Đăng xuất thành công!");
      }
    },
    setServerAddr() {
      if (
        this.formConfig.domain &&
        /^https?:\/\//.test(this.formConfig.domain)
      ) {
        this.$store.commit("setServerAddr", this.formConfig.domain);
        this.dialogConfig = false;
        this.$message.success("Config successfully");
      } else {
        this.$message.error("Invalid domain");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
nav {
  background-color: #012596;
  height: 5vh;
  width: 100vw;
  position: fixed;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: drag;
  border-bottom: 1px solid #aeb6bf;
  overflow: visible;
}

.left-bar,
.center-bar,
.right-bar {
  display: flex;
  align-items: center;
}

.left-bar {
  z-index: 10;
  width: 15%;
  min-width: 80px;
}

.center-bar {
  width: 70%;
  justify-content: center;
}

.right-bar {
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-right: 16px;
}
.logo-container {
  border-radius: 12px;
  transition: background 0.2s, box-shadow 0.2s;
  padding: 10px 8px;
  display: flex;
  align-items: center;
}

.search-container {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 4px;
  padding: 2px 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 300px;
  cursor: pointer;
  position: relative;
  z-index: 2000;

  .search-icon {
    color: #012596;
    font-size: 16px;
    margin-right: 6px;
    transition: color 0.3s;
  }

  input {
    border: none;
    background: transparent;
    outline: none;
    color: #fff;
    font-size: 14px;
    width: 70px;
    transition: width 0.3s, background 0.3s, color 0.3s;
    &::placeholder {
      color: rgba(0, 0, 0, 0.5);
      opacity: 1;
    }
  }

  &.expanded {
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 350px;

    .search-icon {
      color: #012596;
    }

    input {
      color: #333;
      width: 260px; // giảm tương ứng
      &::placeholder {
        color: #888;
      }
    }
  }
}

.search-suggest {
  background: #fff;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  li {
    padding: 10px 16px;
    cursor: pointer;
    font-size: 16px;
    color: #222;
    &:hover {
      background: #f5f5f5;
      color: black;
    }
  }
}
.greeting {
  color: #fff;
  margin-right: 20px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
// .top-windows {
//   height: 5vh !important;
// }
</style>
