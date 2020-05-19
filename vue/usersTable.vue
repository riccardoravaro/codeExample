<template>
  <v-card class="ma-1" :style="{height: '100%'}">
    <v-card-text class="py-2">
      <v-toolbar flat color="white">
        <v-toolbar-title>Users</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialog" max-width="900px">
          <template v-slot:activator="{ on }">
            <v-btn :color="basecolor" dark class="mb-2" v-on="on">New User</v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
              <v-container grid-list-md>
                <v-form ref="form" v-model="valid">
                  <v-row >
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.customId"
                        :color="basecolor"
                        label="User ID *"
                        :rules="customIdRules"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.name"
                        :color="basecolor"
                        label="Full name *"
                        :rules="nameRules"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.username"
                        :color="basecolor"
                        label="Username *"
                        :rules="usernameRules"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.company"
                        :color="basecolor"
                        label="Company *"
                        :rules="companyRules"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.address"
                        :color="basecolor"
                        label="Address *"
                        :rules="addressRules"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-select
                        v-model="editedItem.country"
                        :color="basecolor"
                        label="Country *"
                        item-text="name"
                        item-value="code"
                        :items="countries"
                        :rules="coutryRules"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field v-model="editedItem.phone" :color="basecolor" label="Phone"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.email"
                        :color="basecolor"
                        label="Email *"
                        :rules="emailRules"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="12" md="6">
                      <v-text-field
                        v-model="editedItem.password"
                        :color="basecolor"
                        type="password"
                        :rules="this.editedIndex === -1  ? passRules : []"
                        :label="this.editedIndex === -1  ? 'Password *' : 'New Password'"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="12">  
                      <v-checkbox
                      :color="basecolor"
                        v-model="editedItem.forceResetPassoword"
                        :label="`Force password reset`"
                      ></v-checkbox>
                    </v-col>
                    <v-col cols="12" sm="12" md="6">
                      <v-select
                        :items="roles"
                        :color="basecolor"
                        item-text="name"
                        item-value="id"
                        v-model="editedItem.roles"
                        :loading="loadingRoles"
                        label="Role *"
                        :rules="roleRules"
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-form>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="red" flat @click="close">Cancel</v-btn>
              <v-btn :color="basecolor" flat @click="save">Save</v-btn>
            </v-card-actions>
            <loader :loading="loadingData" v-if="loadingData"/>
          </v-card>
        </v-dialog>
      </v-toolbar>
      <v-data-table
        :loading="loading"
        :headers="usersHeaders"
        :items="users"
        :pagination.sync="pagination"
        
        class="small-rows"
      >
        <template  v-slot:item="{ item }">
          <tr>
            <td>{{ item.name }}</td>
            <td>{{ item.username }}</td>
            <td>{{ item.email }}</td>
            <td>{{ item.phone }}</td>
            <td
            >{{ typeof item.roles === 'object' ? item.roles.name: null }}</td>
            <td class="justify-center layout px-0">
              <v-icon small class="mr-2" @click="editItem(item)">edit</v-icon>
              <v-icon small @click="deleteConfirm(item)">delete</v-icon>
            </td>
          </tr>
        </template>
      </v-data-table>
      <v-dialog v-model="confirm" max-width="290">
        <v-card style='padding: 1.2em; text-align: center'>
          <v-card-title class="headline">Confirm User Delete</v-card-title>

          <v-card-text>Are you sure you want to delete this user?</v-card-text>

          <v-card-actions style="justify-content: center; margin-top: 1em">

            <v-btn color="error" flat small @click="closeConfirm">No</v-btn>

            <v-btn :color="basecolor" flat small @click="deleteUser">Yes</v-btn>
          </v-card-actions>
          <loader :loading="loadingData" v-if="loadingData"/>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script>
import api from "~/api";
import { debounce } from "debounce";
import { basecolor } from "@/assets/style/theme.scss";
import * as countriesList from "../dashboard/formFields/countries.json";
import Loader from '@/components/common/loader'

export default {
  components: {Loader},
  data() {
    return {
      loadingData: false,
      valid: true,
      dialog: false,
      confirm: false,
      loading: true,
      basecolor,
      loadingRoles: false,
      pagination: {
        rowsPerPage: 25
      },
      usersHeaders: [
        { text: "Name", value: "name" },
        { text: "UserName", value: "username" },
        { text: "Email", value: "email" },
        { text: "Phone", value: "phone" },
        { text: "Role", value: "role" },
        { text: "Actions", value: "name", align: "center", sortable: false }
      ],
      editedIndex: -1,
      editedItem: {
        id: "",
        name: "",
        username: "",
        company: "",
        address: "",
        country: "",
        email: "",
        phone: "",
        roles: null
      },
      defaultItem: {
        name: "",
        username: "",
        company: "",
        address: "",
        country: "",
        email: "",
        phone: "",
        roles: null
      },
      deleteItem: null,
      countries: countriesList.default,
      users: [],
      roles: [],
      customIdRules: [v => !!v || "User ID is required"],
      nameRules: [v => !!v || "Full Name is required"],
      usernameRules: [v => !!v || "Username is required"],
      passRules: [v => !!v || "Password is required"],
      emailRules: [
        v => !!v || "Email address is required",
        v => /.+@.+\..+/.test(v) || "E-mail address must be valid"
      ],
      roleRules: [v => !!v || "Role is required"],
      coutryRules:   [ v => !!v  || "Country is required"],
      addressRules: [ v  => !!v || "Address is required"],
      companyRules: [ v  => !!v || "Address is required"],
    };
  },
  created() {
    this.loadRecords();
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New User" : "Edit User";
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
      !val || this.loadRoles();
    },
    confirm(val) {
      val || this.closeConfirm();
    }
  },
  methods: {
    loadRecords() {
      this.loading = true;
      api.users.list({ include: "roles", order: "id DESC" }).then(res => {
        res.data.map(user => {
          user.roles =
            user.roles && user.roles.length > 0
              ? { id: user.roles[0].id, name: user.roles[0].name }
              : "";
        });
        this.users = res.data;
        this.loading = false;
      });
    },
    loadRoles() {
      this.loadingRoles = true;
      api.roles.list().then(response => {
        this.roles = response.data;
        this.loadingRoles = false;
      });
    },
    editItem(item) {
      this.editedIndex = this.users.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },
    deleteConfirm(item) {
      this.confirm = true;
      this.deleteItem = item;
    },
    async deleteUser() {
      this.loadingData = true
      var user = await api.users
        .delete(this.deleteItem.id)
        .then(res => {
          this.loadingData = false
          res.data});
      const index = this.users.indexOf(this.deleteItem);
      this.users.splice(index, 1);
      this.closeConfirm();
    },
    close() {
      this.dialog = false;
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
      this.$refs.form.resetValidation();
    },
    closeConfirm() {
      this.confirm = false;
      this.deleteItem = null;
    },
    async save() {
      if (this.$refs.form.validate()) {
        this.loadingData = true;
        if (this.editedIndex > -1) {
          var recId = this.editedItem.id;
          var roleName;
          if (typeof this.editedItem.roles !== "object") {
            roleName = this.roles.filter(
              role => role.id === this.editedItem.roles
            );
            await api.roles.deleteAll(recId).then(async res => {
              await api.roles.update({
                id: recId,
                roleId: this.editedItem.roles
              });
            });
          } else {
            roleName = this.roles.filter(
              role => role.id === this.editedItem.roles.id
            );
          }

          delete this.editedItem.id;
          delete this.editedItem.roles;
          var user = await api.users
            .upsert(recId, this.editedItem)
            .then(res => res.data)
            .catch(error => {
              this.$store.dispatch("setToast", {
                type: "error",
                message:
                  error.response.data.error.message || error.reponse.status
              });
            });
          if (user) {
            user.roles = roleName[0];
            this.users.splice(this.editedIndex, 1, user);
            this.close();
          }
          this.loadingData = false
        } else {
          delete this.editedItem.id;
          var user = await api.users
            .insert(this.editedItem)
            .then(res => res.data)
            .catch(error => {
              this.$store.dispatch("setToast", {
                type: "error",
                message:
                  error.response.data.error.message || error.reponse.status
              });
            });
          if (user) {
            roleName = this.roles.filter(
              role => role.id === this.editedItem.roles
            );
            await api.roles.deleteAll(user.id).then(async res => {
              await api.roles.update({
                id: user.id,
                roleId: this.editedItem.roles
              });
            });
            user.roles = roleName[0];
            this.users.unshift(user);
            this.close();
          }
          this.loadingData = false
        }
      }
    }
  }
};
</script>
