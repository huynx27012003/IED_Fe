<template>
  <div class="home-container">
    <!-- TOC Left -->
    <aside class="toc-right">
      <h1>AT-Digital-CIM</h1>
      <h3>Table of contents</h3>
      <ul>
        <li
          v-for="item in contents"
          :key="item.id"
          :class="{ active: activeSection === item.id }"
        >
          <a href="#" @click.prevent="scrollToSection(item.id)">
            {{ item.title }}
          </a>
        </li>
      </ul>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <h1>TC57CIM</h1>
      <section
        v-for="item in contents"
        :key="item.id"
        :id="item.id"
        class="section-block"
      >
        <div class="section-header">
          <h2>{{ item.title }}</h2>
          <el-button
            v-if="
              item.id === 'Classes' &&
              $store.state.user &&
              $store.state.user.authorities &&
              $store.state.user.authorities.includes('ADMIN')
            "
            type="primary"
            class="add-class-btn"
            @click="openAddClassDialog"
          >
            +
          </el-button>
        </div>
        <table class="cim-table" v-if="getDataList(item.id).length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in getDataList(item.id)"
              :key="row.id"
              @contextmenu="
                showContextMenu(
                  $event,
                  row,
                  item.id === 'Classes' ? 'class' : 'slot'
                )
              "
            >
              <td>
                <router-link
                  v-if="row.name"
                  :to="{
                    name: item.id === 'Slots' ? 'AttributeView' : 'ClassView',
                    params: { name: row.name },
                  }"
                  class="link"
                >
                  {{ row.name }}
                </router-link>
                <span v-else>{{ row.name || "No name available" }}</span>
              </td>
              <td>{{ row.description }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else><Loading /></div>
      </section>
    </main>

    <!-- Custom Context Menu -->
    <div
      v-if="
        contextMenu.visible &&
        $store.state.user &&
        $store.state.user.authorities &&
        $store.state.user.authorities.includes('ADMIN')
      "
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      class="custom-context-menu"
    >
      <div
        v-if="
          contextMenu.type === 'class' &&
          $store.state.user &&
          $store.state.user.authorities &&
          $store.state.user.authorities.includes('ADMIN')
        "
        class="context-item"
        @click="openEditClassDialog"
      >
        Edit Class
      </div>
      <div
        v-if="
          contextMenu.type === 'class' &&
          $store.state.user &&
          $store.state.user.authorities &&
          $store.state.user.authorities.includes('ADMIN')
        "
        class="context-item"
        @click="openAddClassDialog"
      >
        Add New Class
      </div>
      <div
        v-if="
          contextMenu.type === 'class' &&
          $store.state.user &&
          $store.state.user.authorities &&
          $store.state.user.authorities.includes('ADMIN')
        "
        class="context-item"
        style="color: red"
        @click="confirmDeleteClass"
      >
        Delete Class
      </div>
      <div
        v-if="
          contextMenu.type === 'slot' &&
          $store.state.user &&
          $store.state.user.authorities &&
          $store.state.user.authorities.includes('ADMIN')
        "
        class="context-item"
        @click="openEditSlotDialog"
      >
        Edit Slot
      </div>
      <div
        v-if="
          contextMenu.type === 'slot' &&
          $store.state.user &&
          $store.state.user.authorities &&
          $store.state.user.authorities.includes('ADMIN')
        "
        class="context-item"
        style="color: red"
        @click="confirmDeleteSlot"
      >
        Delete Slot
      </div>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="editDialogVisible" title="Edit Info" width="400px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="ID">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="Class ID" v-if="contextMenu.type === 'slot'">
          <el-input v-model="editForm.classId" disabled />
        </el-form-item>
        <el-form-item label="Name">
          <el-input
            v-model="editForm.name"
            :disabled="
              contextMenu.type !== 'slot' && contextMenu.type !== 'class'
            "
          />
        </el-form-item>
        <el-form-item label="Description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :disabled="
              contextMenu.type !== 'slot' && contextMenu.type !== 'class'
            "
          />
        </el-form-item>
        <el-form-item label="Image" v-if="contextMenu.type === 'class'">
          <el-input v-model="editForm.image" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveEdit">Save</el-button>
      </template>
    </el-dialog>

    <!-- Dialog cho Class -->
    <el-dialog
      v-model="editClassDialogVisible"
      :title="isAddClassDialog ? 'Add New Class' : 'Edit Class'"
      width="400px"
    >
      <el-form :model="editClassForm" label-width="100px">
        <el-form-item label="ID">
          <el-input v-model="editClassForm.id" disabled />
        </el-form-item>
        <el-form-item label="Parent Class">
          <el-input v-model="editClassForm.parentClass" />
        </el-form-item>
        <el-form-item label="Name">
          <el-input v-model="editClassForm.name" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="editClassForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="Image">
          <el-input v-model="editClassForm.image" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editClassDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveEditClass">Save</el-button>
      </template>
    </el-dialog>

    <!-- Add Class Dialog -->
    <el-dialog
      v-model="advancedAddClassDialogVisible"
      @close="closeAddClassDialog"
      title="Add New Class"
      width="90%"
      class="advanced-dialog"
    >
      <div class="advanced-class-editor">
        <!-- Basic Information -->
        <div class="section-card basic-info">
          <h3 class="section-title">
            <i class="el-icon-info"></i>
            Thông tin cơ bản
          </h3>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Tên Class" required>
                <el-input
                  v-model="advancedClassForm.name"
                  placeholder="VD: User, Product, Order..."
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Class Cha">
                <el-select
                  v-model="advancedClassForm.parentClassName"
                  filterable
                  placeholder="Chọn class cha"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="cls in parentClassOptions"
                    :key="cls.id"
                    :label="cls.name"
                    :value="cls.name"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Mô tả Class">
            <el-input
              v-model="advancedClassForm.description"
              type="textarea"
              :rows="3"
              placeholder="Mô tả chức năng và mục đích của class này..."
            />
          </el-form-item>
        </div>

        <!-- Attributes Section -->
        <div class="section-card attributes-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="el-icon-data-line"></i>
              Thuộc tính (Attributes)
            </h3>
            <el-button
              type="success"
              size="small"
              @click="addAttribute"
              icon="el-icon-plus"
            >
              Thêm thuộc tính
            </el-button>
          </div>

          <div class="attributes-list">
            <div
              v-for="(attr, index) in advancedClassForm.attributes"
              :key="index"
              class="attribute-card"
            >
              <div class="attribute-header">
                <h4>Thuộc tính #{{ index + 1 }}</h4>
                <el-button
                  v-if="advancedClassForm.attributes.length > 1"
                  size="mini"
                  icon="el-icon-minus"
                  @click="removeAttribute(index)"
                />
              </div>

              <el-row :gutter="15">
                <el-col :span="8">
                  <el-form-item label="Tên thuộc tính">
                    <el-input
                      v-model="attr.name"
                      placeholder="VD: name, email, age..."
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Kiểu dữ liệu">
                    <el-select v-model="attr.dataType" style="width: 100%">
                      <el-option
                        v-for="type in dataTypes"
                        :key="type"
                        :label="type"
                        :value="type"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Tùy chọn">
                    <div class="checkbox-group">
                      <el-checkbox v-model="attr.isPrimary"
                        >Primary Key</el-checkbox
                      >
                      <el-checkbox v-model="attr.isForeign"
                        >Foreign Key</el-checkbox
                      >
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="Mô tả">
                <el-input
                  v-model="attr.description"
                  placeholder="Mô tả ý nghĩa của thuộc tính này..."
                />
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- Associations Section -->
        <div class="section-card associations-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="el-icon-connection"></i>
              Mối quan hệ (Associations)
            </h3>
            <el-button
              type="primary"
              size="small"
              @click="addAssociation"
              icon="el-icon-plus"
              :disabled="!hasForeignKeyAttribute"
            >
              Thêm mối quan hệ
            </el-button>
          </div>

          <div
            v-if="advancedClassForm.associations.length === 0"
            class="empty-associations"
          >
            <i
              class="el-icon-connection"
              style="font-size: 48px; color: #ddd"
            ></i>
            <p>Chưa có mối quan hệ nào. Nhấn "Thêm mối quan hệ" để bắt đầu.</p>
          </div>

          <div class="associations-list">
            <div
              v-for="(assoc, index) in advancedClassForm.associations"
              :key="index"
              class="association-card"
            >
              <div class="association-header">
                <h4>Mối quan hệ #{{ index + 1 }}</h4>
                <el-button
                  v-if="advancedClassForm.associations.length > 1"
                  size="mini"
                  icon="el-icon-minus"
                  @click="removeAssociation(index)"
                />
              </div>

              <el-row :gutter="15">
                <el-col :span="6">
                  <el-form-item label="Từ thuộc tính">
                    <el-select
                      v-model="assoc.fromAttributeName"
                      filterable
                      placeholder="Chọn thuộc tính foreign key"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="name in foreignKeyAttributes"
                        :key="name"
                        :label="name"
                        :value="name"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Đến class">
                    <el-select
                      v-model="assoc.toClassName"
                      filterable
                      placeholder="Chọn class"
                      style="width: 100%"
                      clearable
                      @change="onToClassChange($event, index)"
                    >
                      <el-option
                        v-for="cls in parentClassOptions"
                        :key="cls.id"
                        :label="cls.name"
                        :value="cls.name"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Đến thuộc tính">
                    <el-select
                      v-model="assoc.toAttributeName"
                      filterable
                      placeholder="Chọn attribute"
                      style="width: 100%"
                      :disabled="!assoc.toClassName"
                    >
                      <el-option
                        v-for="attr in associationAttributes[index] || []"
                        :key="attr.id"
                        :label="attr.name"
                        :value="attr.name"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Loại quan hệ">
                    <el-select
                      v-model="assoc.relationshipType"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="type in relationshipTypes"
                        :key="type"
                        :label="type"
                        :value="type"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>

        <!-- JSON/SQL Preview/Edit Section -->
        <div class="section-card json-preview">
          <div class="section-header">
            <h3 class="section-title">
              <i class="el-icon-document"></i>
              {{
                isSqlEditMode
                  ? "SQL Preview/Edit"
                  : isJsonEditMode
                  ? "JSON Preview/Edit"
                  : "Form Preview"
              }}
            </h3>
            <div class="json-actions">
              <el-button
                size="small"
                @click="toggleFormMode"
                :type="
                  !isJsonEditMode && !isSqlEditMode ? 'primary' : 'default'
                "
              >
                Form Mode
              </el-button>
              <el-button
                size="small"
                @click="toggleJsonMode"
                :type="isJsonEditMode ? 'primary' : 'default'"
              >
                JSON Mode
              </el-button>
              <el-button
                size="small"
                @click="toggleSqlMode"
                :type="isSqlEditMode ? 'primary' : 'default'"
              >
                SQL Mode
              </el-button>
              <el-button
                v-if="isJsonEditMode"
                size="small"
                type="success"
                @click="parseJsonToForm"
              >
                Parse JSON
              </el-button>
              <el-button
                v-if="isSqlEditMode"
                size="small"
                type="success"
                @click="parseSqlToForm"
              >
                Parse SQL
              </el-button>
            </div>
          </div>

          <!-- SQL Edit Mode -->
          <div v-if="isSqlEditMode" class="sql-edit-mode">
            <el-input
              v-model="sqlInput"
              type="textarea"
              :rows="15"
              placeholder="Paste your SQL CREATE TABLE statement here..."
              class="sql-textarea"
            />
            <div class="sql-hint">
              <i class="el-icon-info"></i>
              Paste your SQL CREATE TABLE statement here and click "Parse SQL"
              to populate the form
            </div>
          </div>

          <!-- JSON Edit Mode -->
          <div v-if="isJsonEditMode" class="json-edit-mode">
            <el-input
              v-model="jsonInput"
              type="textarea"
              :rows="15"
              placeholder="Paste your JSON here..."
              class="json-textarea"
            />
            <div class="json-hint">
              <i class="el-icon-info"></i>
              Paste your JSON data here and click "Parse JSON" to populate the
              form
            </div>
          </div>

          <!-- Form Preview Mode -->
          <div v-else class="json-preview-mode">
            <pre class="json-content">{{ formattedJson }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="advancedAddClassDialogVisible = false">
            Hủy
          </el-button>
          <el-button type="primary" @click="saveAdvancedClass">
            Tạo Class
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog cho Slot -->
    <el-dialog
      v-model="editSlotDialogVisible"
      :title="isAddSlotDialog ? 'Add New Slot' : 'Edit Slot'"
      width="400px"
    >
      <el-form :model="editSlotForm" label-width="100px">
        <el-form-item label="ID">
          <el-input v-model="editSlotForm.id" disabled />
        </el-form-item>
        <el-form-item label="Class ID">
          <el-input v-model="editSlotForm.classId" />
        </el-form-item>
        <el-form-item label="Name">
          <el-input v-model="editSlotForm.name" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="editSlotForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editSlotDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveEditSlot">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";
import {
  fetchClasses,
  updateClass,
  addClass,
  deleteClass,
  fetchClassFullAttributes,
} from "@/api/classes";
import {
  getAllAttributes,
  findAttributeByName,
  updateAttribute,
  deleteAttributeById,
} from "@/api/attribute";
import { getAssociationByAttrId, deleteAssociation } from "@/api/index";

export default {
  name: "Home",
  components: {
    Loading,
  },
  data() {
    return {
      contents: [
        { id: "Classes", title: "Classes" },
        { id: "Slots", title: "Slots" },
      ],
      classList: [],
      attributeList: [],
      activeSection: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        row: null,
        type: "",
      },
      editDialogVisible: false,
      editClassDialogVisible: false,
      editSlotDialogVisible: false,
      advancedAddClassDialogVisible: false,
      isAddClassDialog: false,
      isAddSlotDialog: false,
      isJsonEditMode: false,
      isSqlEditMode: false,
      jsonInput: "",
      sqlInput: "",
      editForm: {
        id: "",
        classId: "",
        name: "",
        description: "",
        image: "",
      },
      editClassForm: {
        id: "",
        parentClass: "",
        name: "",
        description: "",
        image: "",
      },
      editSlotForm: {
        id: "",
        classId: "",
        name: "",
        description: "",
      },
      advancedClassForm: {
        name: "",
        description: "",
        parentClassName: "",
        attributes: [
          {
            name: "",
            dataType: "string",
            isPrimary: false,
            isForeign: false,
            description: "",
          },
        ],
        associations: [],
        toClassAttributes: [],
      },
      dataTypes: [
        "string",
        "integer",
        "float",
        "boolean",
        "date",
        "datetime",
        "text",
        "real",
      ],
      relationshipTypes: [
        "ONE_TO_ONE",
        "ONE_TO_MANY",
        "MANY_TO_ONE",
        "MANY_TO_MANY",
      ],
      parentClassOptions: [],
      associationAttributes: [],
    };
  },
  computed: {
    formattedJson() {
      const filteredData = {
        ...this.advancedClassForm,
        attributes: this.advancedClassForm.attributes.filter((attr) =>
          attr.name.trim()
        ),
        associations: this.advancedClassForm.associations.filter((assoc) =>
          assoc.fromAttributeName.trim()
        ),
      };
      return JSON.stringify(filteredData, null, 2);
    },
    hasForeignKeyAttribute() {
      return this.advancedClassForm.attributes.some((attr) => attr.isForeign);
    },
    foreignKeyAttributes() {
      return this.advancedClassForm.attributes
        .filter((attr) => attr.isForeign && attr.name && attr.name.trim())
        .map((attr) => attr.name.trim());
    },
  },
  async mounted() {
    this.classList = await fetchClasses();
    this.attributeList = await getAllAttributes();

    this.$nextTick(() => {
      window.addEventListener("scroll", this.handleScroll);
      this.handleScroll();
    });
    document.addEventListener("click", () => {
      this.contextMenu.visible = false;
    });
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
    document.removeEventListener("click", () => {
      this.contextMenu.visible = false;
    });
  },
  methods: {
    toPascalCase(str) {
      if (!str) return "";
      return str
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
    },
    getDataList(type) {
      if (type === "Classes") return this.classList;
      if (type === "Slots") return this.attributeList;
      return [];
    },
    scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    handleScroll() {
      let active = null;
      for (const item of this.contents) {
        const section = document.getElementById(item.id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top < window.innerHeight / 2) {
            active = item.id;
          }
        }
      }
      this.activeSection = active;
    },
    handleContextMenu(event) {
      event.preventDefault();
      this.contextMenu.x = event.clientX;
      this.contextMenu.y = event.clientY;
      this.contextMenu.visible = true;
    },
    showContextMenu(event, row, type) {
      event.preventDefault();
      this.contextMenu.visible = true;
      this.contextMenu.row = row;
      this.contextMenu.type = type;
      const menuWidth = 120;
      const menuHeight = 120;
      const viewportWidth = window.innerWidth;
      let x = event.clientX;
      let y = event.clientY - menuHeight;
      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth;
      }

      x = Math.max(0, x);
      y = Math.max(0, y);

      this.contextMenu.x = x;
      this.contextMenu.y = y;
    },
    openEditClassDialog() {
      this.contextMenu.visible = false;
      if (this.contextMenu.row) {
        this.editClassForm = {
          id: this.contextMenu.row.id || "",
          parentClass: this.contextMenu.row.parentClass || "",
          name: this.contextMenu.row.name || "",
          description: this.contextMenu.row.description || "",
          image: this.contextMenu.row.image || "",
        };
        this.editClassDialogVisible = true;
      }
    },
    async openEditSlotDialog() {
      this.contextMenu.visible = false;
      try {
        const attrArr = await findAttributeByName(this.contextMenu.row.name);
        const attr = Array.isArray(attrArr) ? attrArr[0] : attrArr;
        if (attr) {
          this.editSlotForm = {
            id: attr.id || "",
            classId: attr.classId || "",
            name: attr.name || "",
            description: attr.description || "",
          };
          this.editSlotDialogVisible = true;
        } else {
          this.$message.error("Không tìm thấy attribute!");
        }
      } catch (e) {
        this.$message.error("Không tìm thấy attribute!");
      }
    },
    async openAddClassDialog() {
      this.contextMenu.visible = false;
      this.advancedClassForm = {
        name: "",
        description: "",
        parentClassName: "",
        attributes: [
          {
            name: "",
            dataType: "string",
            isPrimary: false,
            isForeign: false,
            description: "",
          },
        ],
        associations: [],
        toClassAttributes: [],
      };
      this.isJsonEditMode = false;
      this.isSqlEditMode = false;
      this.jsonInput = "";
      this.sqlInput = "";
      this.parentClassOptions = this.classList || [];
      this.advancedAddClassDialogVisible = true;
    },
    async saveEdit() {
      try {
        if (this.contextMenu.type === "class") {
          await updateClass(this.editForm);
          this.$message.success("Cập nhật class thành công!");
          this.classList = await fetchClasses();
        } else if (this.contextMenu.type === "slot") {
          await updateAttribute(this.editForm);
          this.$message.success("Cập nhật attribute thành công!");
          this.attributeList = await getAllAttributes();
        }
        this.editDialogVisible = false;
      } catch (error) {
        this.$message.error("Cập nhật thất bại!");
      }
    },
    async saveEditClass() {
      try {
        if (this.isAddClassDialog) {
          await addClass(this.editClassForm);
          this.$message.success("Thêm class thành công!");
        } else {
          await updateClass(this.editClassForm);
          this.$message.success("Cập nhật class thành công!");
        }
        this.editClassDialogVisible = false;
        this.classList = await fetchClasses();
      } catch (error) {
        this.$message.error(
          this.isAddClassDialog
            ? "Thêm class thất bại!"
            : "Cập nhật class thất bại!"
        );
      } finally {
        this.isAddClassDialog = false;
      }
    },
    async saveEditSlot() {
      try {
        if (this.isAddSlotDialog) {
          this.$message.success("Thêm attribute thành công!");
        } else {
          await updateAttribute(this.editSlotForm);
          this.$message.success("Cập nhật attribute thành công!");
        }
        this.editSlotDialogVisible = false;
        this.attributeList = await getAllAttributes();
      } catch (error) {
        this.$message.error(
          this.isAddSlotDialog
            ? "Thêm attribute thất bại!"
            : "Cập nhật attribute thất bại!"
        );
      } finally {
        this.isAddSlotDialog = false;
      }
    },
    addAttribute() {
      this.advancedClassForm.attributes.push({
        name: "",
        dataType: "string",
        isPrimary: false,
        isForeign: false,
        description: "",
      });
    },
    removeAttribute(index) {
      this.advancedClassForm.attributes.splice(index, 1);
    },
    addAssociation() {
      this.advancedClassForm.associations.push({
        fromAttributeName: "",
        toClassName: "",
        toAttributeName: "",
        relationshipType: "ONE_TO_ONE",
        description: "",
      });
      if (!this.associationAttributes) this.associationAttributes = [];
      this.associationAttributes.push([]);
    },
    removeAssociation(index) {
      this.advancedClassForm.associations.splice(index, 1);
      this.associationAttributes.splice(index, 1);
    },
    toggleFormMode() {
      this.isJsonEditMode = false;
      this.isSqlEditMode = false;
    },
    toggleJsonMode() {
      this.isJsonEditMode = !this.isJsonEditMode;
      this.isSqlEditMode = false;
      if (this.isJsonEditMode) {
        this.jsonInput = this.formattedJson;
      }
    },
    toggleSqlMode() {
      this.isSqlEditMode = !this.isSqlEditMode;
      this.isJsonEditMode = false;
      if (this.isSqlEditMode) {
        this.sqlInput = "";
      }
    },
    parseJsonToForm() {
      try {
        const jsonData = JSON.parse(this.jsonInput);

        // Validate required fields
        if (!jsonData.name || !jsonData.name.trim()) {
          this.$message.error('JSON must contain a valid "name" field');
          return;
        }

        // Parse basic info
        this.advancedClassForm.name = jsonData.name || "";
        this.advancedClassForm.description = jsonData.description || "";
        this.advancedClassForm.parentClassName = jsonData.parentClassName || "";

        // Parse attributes
        if (jsonData.attributes && Array.isArray(jsonData.attributes)) {
          this.advancedClassForm.attributes = jsonData.attributes.map(
            (attr) => ({
              name: attr.name || "",
              dataType: attr.dataType || "string",
              isPrimary: attr.isPrimary || false,
              isForeign: attr.isForeign || false,
              description: attr.description || "",
            })
          );
        } else {
          this.advancedClassForm.attributes = [
            {
              name: "",
              dataType: "string",
              isPrimary: false,
              isForeign: false,
              description: "",
            },
          ];
        }

        // Parse associations
        if (jsonData.associations && Array.isArray(jsonData.associations)) {
          this.advancedClassForm.associations = jsonData.associations.map(
            (assoc) => ({
              fromAttributeName: assoc.fromAttributeName || "",
              toClassName: assoc.toClassName || "",
              toAttributeName: assoc.toAttributeName || "",
              relationshipType: assoc.relationshipType || "ONE_TO_ONE",
              description: assoc.description || "",
            })
          );

          this.associationAttributes = new Array(
            this.advancedClassForm.associations.length
          ).fill([]);

          this.advancedClassForm.associations.forEach(async (assoc, index) => {
            if (assoc.toClassName) {
              await this.onToClassChange(assoc.toClassName, index);
            }
          });
        } else {
          this.advancedClassForm.associations = [];
          this.associationAttributes = [];
        }

        this.isJsonEditMode = false;
        this.$message.success("JSON parsed successfully!");
      } catch (error) {
        this.$message.error("Invalid JSON format: " + error.message);
      }
    },
    parseSqlToForm() {
      try {
        const sql = this.sqlInput.trim();
        console.log("Input SQL:", sql);

        if (!sql.toUpperCase().startsWith("CREATE TABLE")) {
          this.$message.error("SQL must be a valid CREATE TABLE statement");
          return;
        }

        // Trích xuất tên bảng (hỗ trợ tên có khoảng trắng)
        const tableNameMatch = sql.match(/CREATE TABLE\s+"?([^"]+)"?\s+\(/i);
        if (!tableNameMatch) {
          this.$message.error("Invalid table name in SQL");
          console.error("Table name regex failed to match:", sql);
          return;
        }
        const tableName = tableNameMatch[1].trim(); // Loại bỏ khoảng trắng thừa
        const pascalTableName = this.toPascalCase(tableName);
        console.log("Table name:", tableName, "PascalCase:", pascalTableName);

        // Trích xuất thân bảng
        const bodyMatch = sql.match(/\(([\s\S]*?)\)\s*(?:;)?$/);
        if (!bodyMatch) {
          this.$message.error("Invalid SQL table body");
          console.error("Body regex failed to match:", sql);
          return;
        }
        const bodyRaw = bodyMatch[1];
        console.log("Raw SQL body:", bodyRaw);

        // Chia dòng, giữ nguyên các chuỗi trong ngoặc kép
        const body = bodyRaw
          .split(/,\s*(?=(?:"[^"]*"|[^"])*$)/)
          .map((line) => line.trim())
          .filter((line) => line);
        console.log("SQL body lines:", body);

        const attributes = [];
        const associations = [];
        let parentClassName = "";
        let primaryKey = null;

        // Bước 1: Thu thập tất cả các cột
        body.forEach((line) => {
          const columnMatch = line.match(
            /"?(\w+)"?\s+([A-Z]+)(?:\s+NOT NULL)?$/i
          );
          if (columnMatch) {
            const [, columnName, dataType] = columnMatch;
            console.log("Found column:", columnName, "Type:", dataType);
            attributes.push({
              name: columnName,
              dataType: dataType.toLowerCase(),
              isPrimary: false,
              isForeign: false,
              description: "",
            });
          }
        });

        // Bước 2: Xử lý PRIMARY KEY trước
        body.forEach((line) => {
          const primaryKeyMatch = line.match(/PRIMARY KEY\s*\("(\w+)"\)?\s*/i);
          if (primaryKeyMatch) {
            primaryKey = primaryKeyMatch[1];
            console.log("Primary Key found:", primaryKey);
            const attr = attributes.find((a) => a.name === primaryKey);
            if (attr) {
              attr.isPrimary = true;
              console.log("Updated isPrimary for:", attr.name);
            } else {
              console.warn("Primary Key attribute not found:", primaryKey);
              this.$message.warning(
                `Primary Key attribute "${primaryKey}" not found in columns`
              );
            }
          } else if (line.toUpperCase().includes("PRIMARY KEY")) {
            console.warn("PRIMARY KEY detected but not matched:", line);
            this.$message.warning(`Invalid PRIMARY KEY format: "${line}"`);
          }
        });

        // Bước 3: Xử lý FOREIGN KEY
        body.forEach((line) => {
          console.log("Processing FOREIGN KEY line:", line);
          const foreignKeyMatch = line.match(
            /FOREIGN KEY\s*\("(\w+)"\)\s+REFERENCES\s+"?([^"]+)"?\s*\("(\w+)"\)?\s*/i
          );
          if (foreignKeyMatch) {
            const [, fromAttribute, toClass, toAttribute] = foreignKeyMatch;
            console.log("Foreign Key found:", {
              fromAttribute,
              toClass,
              toAttribute,
            });
            const attr = attributes.find((a) => a.name === fromAttribute);
            if (attr) {
              attr.isForeign = true;
              // Nếu thuộc tính là cả PRIMARY KEY và FOREIGN KEY, gán toClass làm parentClassName
              if (attr.isPrimary && fromAttribute === primaryKey) {
                parentClassName = this.toPascalCase(toClass.trim());
                console.log("Set parentClassName to:", parentClassName);
              } else {
                // Chỉ thêm vào associations nếu không phải là thuộc tính kế thừa
                associations.push({
                  fromAttributeName: fromAttribute,
                  toClassName: this.toPascalCase(toClass.trim()),
                  toAttributeName: toAttribute,
                  relationshipType: "ONE_TO_ONE",
                  description: ``,
                });
                console.log("Added association for:", fromAttribute);
              }
            } else {
              console.warn("Foreign Key attribute not found:", fromAttribute);
              this.$message.warning(
                `Foreign Key attribute "${fromAttribute}" not found in columns`
              );
            }
          }
        });

        // Bước 4: Loại bỏ thuộc tính là PRIMARY KEY và FOREIGN KEY khỏi attributes
        if (primaryKey && parentClassName) {
          const index = attributes.findIndex(
            (a) => a.name === primaryKey && a.isForeign
          );
          if (index !== -1) {
            console.log("Removing inherited attribute:", primaryKey);
            attributes.splice(index, 1);
          } else {
            console.warn(
              "Inherited attribute not found for removal:",
              primaryKey
            );
            this.$message.warning(
              `Could not remove inherited attribute "${primaryKey}"`
            );
          }
        }

        // Cập nhật advancedClassForm
        this.advancedClassForm = {
          name: pascalTableName,
          description: ``,
          parentClassName,
          attributes,
          associations,
          toClassAttributes: [],
        };

        console.log(
          "Final advancedClassForm:",
          JSON.stringify(this.advancedClassForm, null, 2)
        );

        // Cập nhật associationAttributes
        this.associationAttributes = new Array(associations.length).fill([]);
        this.advancedClassForm.associations.forEach(async (assoc, index) => {
          if (assoc.toClassName) {
            await this.onToClassChange(assoc.toClassName, index);
          }
        });

        // Chuyển về Form mode
        this.isSqlEditMode = false;
        this.isJsonEditMode = false;
        this.$message.success("SQL parsed successfully!");
      } catch (error) {
        console.error("Error parsing SQL:", error);
        this.$message.error("Invalid SQL format: " + error.message);
      }
    },
    async onToClassChange(className, index) {
      if (!className) {
        this.associationAttributes[index] = [];
        return;
      }

      try {
        const targetClass = this.parentClassOptions.find(
          (cls) => cls.name === className
        );

        if (targetClass) {
          const attributes = await fetchClassFullAttributes(targetClass.id);
          this.associationAttributes[index] = attributes || [];
        } else {
          this.associationAttributes[index] = [];
        }
      } catch (error) {
        console.error("Error fetching class attributes:", error);
        this.associationAttributes[index] = [];
      }
    },
    async saveAdvancedClass() {
      try {
        if (
          !this.advancedClassForm.name ||
          !this.advancedClassForm.name.trim()
        ) {
          this.$message.error("Class name is required!");
          return;
        }

        const validAttributes = this.advancedClassForm.attributes.filter(
          (attr) => attr.name && attr.name.trim()
        );

        const validAssociations = this.advancedClassForm.associations.filter(
          (assoc) =>
            assoc.fromAttributeName &&
            assoc.toClassName &&
            assoc.toAttributeName
        );

        const classData = {
          name: this.advancedClassForm.name.trim(),
          description: this.advancedClassForm.description || "",
          parentClassName: this.advancedClassForm.parentClassName || null,
          attributes: validAttributes,
          associations: validAssociations,
        };

        await addClass(classData);

        this.$message.success("Class created successfully!");
        this.advancedAddClassDialogVisible = false;

        this.classList = await fetchClasses();
      } catch (error) {
        console.error("Error creating class:", error);
        this.$message.error(
          "Failed to create class: " + (error.message || "Unknown error")
        );
      }
    },
    closeAddClassDialog() {
      this.advancedAddClassDialogVisible = false;
      this.isJsonEditMode = false;
      this.isSqlEditMode = false;
      this.jsonInput = "";
      this.sqlInput = "";
      this.advancedClassForm = {
        name: "",
        description: "",
        parentClassName: "",
        attributes: [
          {
            name: "",
            dataType: "string",
            isPrimary: false,
            isForeign: false,
            description: "",
          },
        ],
        associations: [],
        toClassAttributes: [],
      };
      this.associationAttributes = [];
    },
    async confirmDeleteClass() {
      this.contextMenu.visible = false;
      try {
        const result = await this.$confirm(
          "Bạn có chắc chắn muốn xóa class này?",
          "Xác nhận xóa",
          {
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            type: "warning",
          }
        );

        if (result) {
          await deleteClass(this.contextMenu.row.id);
          this.$message.success("Xóa class thành công!");
          this.classList = await fetchClasses();
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("Xóa class thất bại!");
        }
      }
    },
    async confirmDeleteSlot() {
      this.contextMenu.visible = false;
      try {
        const result = await this.$confirm(
          "Bạn có chắc chắn muốn xóa attribute này?",
          "Xác nhận xóa",
          {
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            type: "warning",
          }
        );

        if (result) {
          const attrArr = await findAttributeByName(this.contextMenu.row.name);
          const attr = Array.isArray(attrArr) ? attrArr[0] : attrArr;

          if (attr) {
            try {
              const associations = await getAssociationByAttrId(attr.id);
              if (associations && associations.length > 0) {
                for (const assoc of associations) {
                  await deleteAssociation(assoc.id);
                }
              }
            } catch (e) {
              console.warn(
                "No associations found or error deleting associations:",
                e
              );
            }

            await deleteAttributeById(attr.id);
            this.$message.success("Xóa attribute thành công!");
            this.attributeList = await getAllAttributes();
          } else {
            this.$message.error("Không tìm thấy attribute!");
          }
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("Xóa attribute thất bại!");
        }
      }
    },
  },
};
</script>

<style scoped>
body,
.home-container {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  background: #fff;
  color: #333;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

.toc-right {
  position: fixed;
  left: 0;
  top: 80px;
  width: 220px;
  min-width: 140px;
  max-width: 25vw;
  height: calc(100vh - 80px);
  background: white;
  padding: 20px;
  box-sizing: border-box;
  z-index: 10;
  border-right: 1px solid #eee;
}

.main-content {
  margin-left: 220px;
  padding: 40px 40px;
  max-width: calc(100% - 220px);
  box-sizing: border-box;
  flex: 1 1 auto;
}

@media (max-width: 1024px) {
  .toc-right {
    display: none;
  }
  .main-content {
    margin-left: 0;
    max-width: 100%;
    padding: 20px 10px;
  }
}

.sidebar-left {
  width: 200px;
  margin-top: 80px;
  margin-left: 40px;
  padding: 20px;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  background: white;
}

.sidebar-left h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: black;
}

.sidebar-left ul {
  list-style: none;
  padding: 0;
}

.sidebar-left li {
  margin-bottom: 10px;
}

.sidebar-left a {
  color: #2e7d32;
  text-decoration: none;
}

.sidebar-left a:hover {
  color: red;
}

.main-content {
  flex: 1;
  padding: 40px 40px;
  max-width: 1000px;
  margin: 0 auto;
  margin-left: 240px;
  margin-right: 240px;
}

.main-content h1 {
  font-size: 32px;
  margin-bottom: 10px;
  color: #555;
  font-weight: initial;
}

.uri {
  font-size: 14px;
  margin-bottom: 30px;
  color: #666;
}

.section-block {
  margin-bottom: 60px;
}

.section-block h2 {
  font-size: 24px;
  margin-bottom: 16px;
  border-bottom: 2px solid #eee;
  padding-bottom: 4px;
}

.cim-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  background: white;
  border: 1px solid #ddd;
}

.cim-table th,
.cim-table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.cim-table th {
  background: #f5f5f5;
  text-align: left;
}

.cim-table tr:hover {
  background-color: #f9f9f9;
}

.link {
  color: #2eaf4a;
  text-decoration: none;
  cursor: pointer;
}

.link:hover {
  color: red;
}

.toc-right h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.toc-right ul {
  list-style: none;
  padding: 0;
}

.toc-right li {
  margin-bottom: 10px;
}

.toc-right a:hover {
  color: red;
}

.toc-right a,
.toc-right a:visited,
.toc-right a:focus,
.toc-right a:active {
  color: #333;
  text-decoration: none;
  outline: none;
  transition: color 0.2s ease;
}

.custom-context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #ccc;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 4px 0;
}

.context-item {
  padding: 8px 16px;
  cursor: pointer;
}

.context-item:hover {
  background: #f5f5f5;
}

.el-dialog {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-width: 90%;
  margin: 0 auto;
}

.el-dialog__header {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.el-dialog__title {
  margin: 0;
  font-weight: 500;
}

.el-dialog__headerbtn {
  top: 12px;
  right: 12px;
  font-size: 16px;
}

.el-dialog__body {
  padding: 20px;
  font-size: 14px;
  color: #555;
}

.el-form-item {
  margin-bottom: 15px;
}

.el-form-item__label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.el-input,
.el-select {
  width: 100%;
  border-radius: 4px;
}

.el-input__inner {
  border-color: #dcdcdc;
  height: 36px;
  font-size: 14px;
}

.el-input__inner:disabled {
  background: #f5f5f5;
  color: #999;
}

.el-textarea__inner {
  border-color: #dcdcdc;
  border-radius: 4px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
}

.el-dialog__footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  text-align: right;
  background: #fafafa;
}

.el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.el-button--primary {
  background: #409eff;
  border-color: #409eff;
}

.el-button--primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.el-button:hover {
  opacity: 0.9;
}

.el-button--default {
  background: #fff;
  border-color: #dcdcdc;
  color: #606266;
}

.advanced-dialog {
  max-width: 400px !important;
  width: 80% !important;
  margin: 0 auto;
}

.advanced-class-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 15px;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.attributes-list,
.associations-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.attribute-card,
.association-card {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  background: #fafafa;
}

.attribute-header,
.association-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.checkbox-group {
  display: flex;
  gap: 10px;
}

.json-preview {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.json-content {
  margin: 0;
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.sql-edit-mode {
  margin-top: 10px;
}

.sql-textarea {
  width: 100%;
}

.sql-hint {
  margin-top: 10px;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.json-edit-mode {
  margin-top: 10px;
}

.json-textarea {
  width: 100%;
}

.json-hint {
  margin-top: 10px;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.section-card.attributes-section .el-button.el-button--mini,
.section-card.associations-section .el-button.el-button--mini {
  background: transparent !important;
  color: #606266 !important;
  border: 1px solid #dcdcdc !important;
  box-shadow: none !important;
  min-width: 20px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 16px;
}

.section-card.attributes-section .el-button.el-button--mini:hover,
.section-card.associations-section .el-button.el-button--mini:hover {
  background: #f5f5f5 !important;
  color: #606266 !important;
  border-color: #dcdcdc !important;
}

.section-card.attributes-section .el-button.el-button--mini:focus,
.section-card.associations-section .el-button.el-button--mini:focus {
  background: transparent !important;
  color: #606266 !important;
  border-color: #dcdcdc !important;
  outline: none;
}

.classes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.add-class-btn {
  min-width: 35px;
  font-size: 20px;
  font-weight: bold;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
