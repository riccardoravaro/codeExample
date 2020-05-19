<template>
  <v-form ref="form" v-model="valid" :lazy-:validation="lazy" :class="userRole === 'buyer' ? 'pa-3 col-10 offset-1' : ''" >
    <v-row>
      <!-- INTEREST -->
      <v-col
        :xs6="userRole !== 'buyer'"
        class="pa-3"
        :xs12="userRole === 'buyer'"
        style=""
      >
        <v-subheader
          class="component-title"
          style=" padding-left: 0px"
        >{{interestType}} interest</v-subheader>
        <v-row class="myFormElements">
          <v-col cols="4">
            <span class="myTitle">Quantity</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="qty"
              :rules="[fieldrules('qtyRules')]"
              type="number"
              :suffix="productInstance && productInstance.unitType"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>
        <v-row class="myFormElements">
          <v-col cols="4">
            <span class="myTitle">Price</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="price"
              :rules="[fieldrules('priceRules')]"
              :suffix="productInstance ? productInstance.showCbd ? '(€/%CBD/' + productInstance.unitType + ')' : '(€/' + productInstance.unitType + ')': ''"
              type="number"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>

        <v-row class="myFormElements" v-if="productInstance && productInstance.showCbd">
          <v-col cols="4">
            <span class="myTitle">CBD%:</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="cbd"
              :rules="[fieldrules('cbdRules')]"
              type="number"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>

        <v-row class="myFormElements" v-if="checkFormFields('cbd') && !productInstance.showCbd">
          <v-col cols="4">
            <span class="myTitle">CBD%:</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="cbd"
              :rules="[fieldrules('cbdRules')]"
              type="number"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>

        <v-row class="myFormElements" v-if="checkFormFields('cbg')">
          <v-col cols="4">
            <span class="myTitle">CBG%:</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="cbg"
              :rules="[fieldrules('cbdRules')]"
              type="number"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>

        <v-row class="myFormElements" v-if="checkFormFields('thc')">
          <v-col cols="4">
            <span class="myTitle">THC%:</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="thc"
              :rules="[fieldrules('thcRules')]"
              type="number"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>

        <v-row class="myFormElements" v-if="productInstance && productInstance.showPurity">
          <v-col cols="4">
            <span class="myTitle">Purity%:</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              class="myFormElements"
              :color="basecolor"
              v-model="purity"
              :rules="[fieldrules('purityRules')]"
              type="number"
              :disabled="viewMode"
            />
          </v-col>
        </v-row>

        <available-from
          :rules="[fieldrules('availableFromRules')]"
          v-if="checkFormFields('date')"
          :product="productInstance.date"
          :setProduct="setProductField"
          :disabled="viewMode"
        />
      </v-col>
      <!-- IDENTIFICATION -->
      <v-col cols="6" class="pa-3"  v-if="userRole === 'seller' || interestType == 'sell'">
        <v-subheader
          class="component-title"
          style=" padding-left: 0px"
        >IDENTIFICATION</v-subheader>
        <origin-country
          :rules="[fieldrules('originCountryRules')]"
          v-if="checkFormFields('originCountry')"
          class="myFormElements"
          :product="productInstance.originCountry"
          :setProduct="setProductField"
          :disabled="viewMode"
        />
        <storage-country
          :rules="[fieldrules('storageCountryRules')]"
          v-if="checkFormFields('storageCountry')"
          class="myFormElements"
          :product="productInstance.storageCountry"
          :setProduct="setProductField"
          :disabled="viewMode"
        />
      </v-col>
    </v-row>

    <v-row style="margin-top: 30px">
      <!-- CHARACTERISTICS  -->
      <v-col
        :xs6="userRole !== 'buyer'"
        class="pa-3"
        :xs12="userRole === 'buyer'"
        
      >
        <v-subheader
          class="component-title"
          style=" padding-left: 0px"
        >CHARACTERISTICS</v-subheader>
        <production-date
          :rules="[fieldrules('productionDateRules')]"
          v-if="checkFormFields('productionDate')"
          :userRole="userRole"
          :product="productInstance.productionDate"
          :setProduct="setProductField"
          :disabled="viewMode"
        />

        <custom-text-field
          :validation="fieldsValidation"
          :rules="[fieldrules('weightRules')]"
          v-if="checkFormFields('weight')"
          :product="productInstance.weight"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'weight')"
          :disabled="viewMode"
        />
        <custom-text-field
          :rules="[fieldrules('densityRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('density')"
          :product="density"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'density')"
          :disabled="viewMode"
        />

        <custom-select
          :rules="[fieldrules('extractionTypeRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('extractionType')"
          :product="productInstance.extractionType"
          :fieldModel="getModel(productInstance.modelOptions,'extractionType')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="extractionType"
          :disabled="viewMode"
        />

        <custom-select
          :rules="[fieldrules('aspectRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('aspect')"
          :product="productInstance.aspect"
          :fieldModel="getModel(productInstance.modelOptions,'aspect')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="aspect"
          :disabled="viewMode"
        />

        <custom-select
          :rules="[fieldrules('compositionRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('composition')"
          :product="productInstance.composition"
          :fieldModel="getModel(productInstance.modelOptions,'composition')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="composition"
          :disabled="viewMode"
        />

        <custom-text-field
          :validation="fieldsValidation"
          :rules="[fieldrules('moistureContentRules')]"
          v-if="checkFormFields('moistureContent')"
          :product="productInstance.moistureContent"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'moistureContent')"
          :disabled="viewMode"
        />
        <!-- <variety
          :validation="fieldsValidation"
          v-if="checkFormFields('variety')"
          :userRole="userRole"
          :product="productInstance.variety"
          :setProduct="setProductField"
          :disabled="viewMode"
        /> -->

        <custom-select
          :rules="[fieldrules('variety')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('variety')"
          :product="productInstance.variety"
          :fieldModel="getModel(productInstance.modelOptions,'variety')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="variety"
          :disabled="viewMode"
        />

        <custom-select
          :rules="[fieldrules('dilutionLiquidRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('dilutionLiquid')"
          :product="productInstance.dilutionLiquid"
          :fieldModel="getModel(productInstance.modelOptions,'dilutionLiquid')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="dilutionLiquid"
          :disabled="viewMode"
        />
        <harvest-date
          :validation="fieldsValidation"
          v-if="checkFormFields('harvestDate')"
          :product="productInstance.harvestDate"
          :setProduct="setProductField"
          :disabled="viewMode"
        />

        <custom-select
          :rules="[fieldrules('typeRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('type')"
          :product="productInstance.type"
          :fieldModel="getModel(productInstance.modelOptions,'type')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="type"
          :disabled="viewMode"
        />

        <custom-select
          :rules="[fieldrules('licensesRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('licenses')"
          :product="productInstance.licenses"
          :fieldModel="getModel(productInstance.modelOptions,'licenses')"
          :userRole="userRole"
          :setProduct="setProductField"
          property="licenses"
          :disabled="viewMode"
        />

        <custom-text-field
          :rules="[fieldrules('packagingWeightRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('packagingWeight')"
          :product="packagingWeight"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'packagingWeight')"
          :disabled="viewMode"
        />

        <custom-text-field
          :rules="[fieldrules('packagingTypeRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('packagingType')"
          :product="productInstance.packagingType"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'packagingType')"
          :disabled="viewMode"
        />

        <custom-text-field
          :rules="[fieldrules('dimensionRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('dimensions')"
          :product="productInstance.dimensions"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'dimensions')"
          :disabled="viewMode"
        />

        <!-- not provided the section must be -->

        <custom-select
          :rules="[fieldrules('productionMethodRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('productionMethod')"
          :product="productInstance.productionMethod"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'productionMethod')"
          :disabled="viewMode"
          property="productionMethod"
        />

        <custom-select
          :rules="[fieldrules('cultureSubstrateRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('cultureSubstrate')"
          :product="productInstance.cultureSubstrate"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'cultureSubstrate')"
          :disabled="viewMode"
          property="cultureSubstrate"
        />

        <custom-select-multiple
          :rules="[fieldrules('certificatesRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('certificates')"
          :product="productInstance.certificates"
          title="Certificates"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'certificates')"
          :disabled="viewMode"
        />

        <custom-text-field
          :rules="[fieldrules('analysisRules')]"
          v-if="checkFormFields('analysis')"
          :product="productInstance.analysis"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'analysis')"
          :disabled="viewMode"
        />
  
        <custom-select
          :rules="[fieldrules('hempOriginRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('hempOrigin')"
          :product="productInstance.hempOrigin"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'hempOrigin')"
          :disabled="viewMode"
          property="hempOrigin"
        />

        <custom-select
          :rules="[fieldrules('facilityTypeRules')]"
          :validation="fieldsValidation"
          v-if="checkFormFields('facilityType')"
          :product="productInstance.facilityType"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'facilityType')"
          :disabled="viewMode"
          property="facilityType"
        />
      </v-col>
      <v-col cols="6" class="pa-3"  v-if="userRole === 'seller' || interestType == 'sell'">
        <v-subheader class="component-title" style=" padding-left: 0px">QUANTITY</v-subheader>

        <custom-text-field
          :rules="[fieldrules('minSizeRules')]"
          v-if="checkFormFields('minSize')"
          :product="productInstance.minSize"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'minSize')"
          :disabled="viewMode"
        />

        <custom-text-field
          :rules="[fieldrules('sampleSizeRules')]"
          v-if="checkFormFields('sampleSize')"
          :product="productInstance.sampleSize"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'sampleSize')"
          :disabled="viewMode"
        />

        <custom-text-field
          :rules="[fieldrules('samplePriceRules')]"
          v-if="checkFormFields('samplePrice')"
          :product="productInstance.samplePrice"
          :userRole="userRole"
          :setProduct="setProductField"
          :fieldModel="getModel(productInstance.modelOptions,'samplePrice')"
          :disabled="viewMode"
        />
      </v-col>
      <!-- CERTIFICATION -->
    </v-row>
    <v-row style="" v-if="userRole === 'seller'  && !viewMode">
      <v-col cols="6" class="pl-3">
        <v-subheader
          class="component-title"
          style=" padding-left: 0px"
        >CERTIFICATION</v-subheader>
        <file-upload
          v-if="showModal"
          :files="filesForUpload"
          :added="fileAdded"
          :deleted="fileDeleted"
          :error="errorinForm"
          @deleteItem="deleteItem"
          @addItem="addItem"
          @filesFoundOnMount="filesFoundOnMount"
          :uploadfiles="beginUpload"
          :productId="product.id"
          :uploadMessage="product.uploadMessage"
          :uploadUrl="productInstance.product? product.id : `${product.id}@${$store.state.auth.user.id}`"
          :disabled="viewMode"
        />
      </v-col>
    </v-row>
    <v-row
      style="margin-top: 0px"
      v-if="interestType === 'sell' && slides && slides.length > 0 && viewMode"
    >
      <v-col cols="12" class="pa-3 pt-0">
        <v-subheader
          class="component-title"
          style=" padding-left: 0px"
        >CERTIFICATION</v-subheader>
        <uploads :slides="slides" />
      </v-col>
    </v-row>
  </v-form>
</template>
<script>
import api from "~/api";
import AvailableFrom from "../formFields/availableFrom";
import customTextField from "../formFields/customTextField";
import FileUpload from "../upload";
import HarvestDate from "../formFields/harvestDate";
import Rules from "./rules";
import OriginCountry from "../formFields/originCountry";
import PassConfirm from "../passConfirm";
import ProductionDate from "../formFields/productionDate";
import customSelect from "../formFields/select";
import customSelectMultiple from "../formFields/selectMultiple";
import StorageCountry from "../formFields/storageCountry";
import Uploads from "../uploadsView";

import { basecolor } from "@/assets/style/theme.scss";
import Loader from "../../common/loader";

export default {
  components: {
    AvailableFrom,
    customTextField,
    FileUpload,
    HarvestDate,
    OriginCountry,
    PassConfirm,
    ProductionDate,
    customSelect,
    customSelectMultiple,
    StorageCountry,
    Uploads,
    Loader
  },
  props: [
    "showModal",
    "setVisible",
    "product",
    "updateProduct",
    "validate",
    "viewMode",
    "slides"
  ],
  data() {
    return {
      updatedCount: false,
      valid: true,
      submitted: false,
      atLeastOneFile: false,
      uploadedFilesCount: 0,
      error: false,
      loading: false,
      lazy: false,
      confirm: false,
      minQuantity: 1,
      beginUpload: false,
      updateDone: true,
      basecolor,
      // productInstance: {},
      filesForUpload: [],
      filesForDelete: [],
      rules: {}
    };
  },
  mounted() {
    this.rules = Rules(this.userRole, this.fieldsValidation, this.minQuantity)
  },
  computed: {
    // interestType: function() {
    //   return this.productInstance && this.productInstance.actionType
    //     ? this.productInstance.actionType
    //     : "";
    // },
    productInstance: {
      get: function() {
        return this.product;
      },
      set: function(value) {
        this.updateProduct(value)
        // this.product = value;
      }
    },
    errorinForm() {
      
      return this.fieldsValidation && this.userRole === "seller"
        ? this.submitted && (!this.atLeastOneFile)
        : false;
    },
    userRole: function() {
      return this.$store.state.auth.currentRole;
    },
    interestType: function() {
      if (this.viewMode) {
        console.log(this.productInstance && this.productInstance.actionType
          ? this.productInstance.actionType
          : "")
        return this.productInstance && this.productInstance.actionType
          ? this.productInstance.actionType
          : "";
      } else {
        return this.$store.state.auth.currentRole === "buyer" ? "buy" : "sell";
      }
    },
    fieldsValidation: function() {
      return this.$store.state.app.settings.fieldsvalidation;
    },
    productName: {
      get: function(value) {
        return this.productInstance ? this.productInstance.name : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "name", value);
      }
    },
    qty: {
      get: function(value) {
        return this.productInstance && this.productInstance.qty
          ? this.productInstance.qty
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "qty", Number(value));
      }
    },
    price: {
      get: function(value) {
        return this.productInstance && this.productInstance.price
          ? this.productInstance.price
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "price", value);
      }
    },
    cbd: {
      get: function(value) {
        return this.productInstance && this.productInstance.cbd
          ? this.productInstance.cbd
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "cbd", value);
      }
    },
    cbg: {
      get: function(value) {
        return this.productInstance && this.productInstance.cbg
          ? this.productInstance.cbg
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "cbg", value);
      }
    },
    thc: {
      get: function(value) {
        return this.productInstance && this.productInstance.thc
          ? this.productInstance.thc
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "thc", value);
      }
    },
    documents: {
      get: function(value) {
        return this.productInstance && this.productInstance.documents
          ? this.productInstance.documents
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "documents", value);
      }
    },
    packagingWeight: {
      get: function(value) {
        return this.productInstance && this.productInstance.packagingWeight
          ? this.productInstance.packagingWeight
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "packagingWeight", value);
      }
    },
    dimensions: {
      get: function(value) {
        return this.productInstance && this.productInstance.dimensions
          ? this.productInstance.dimensions
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "dimensions", value);
      }
    },
    purity: {
      get: function(value) {
        return this.productInstance && this.productInstance.purity
          ? this.productInstance.purity
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "purity", value);
      }
    },
    weight: {
      get: function(value) {
        return this.productInstance && this.productInstance.weight
          ? this.productInstance.weight
          : null;
      },
      set: function(value) {
        this.$set(this.productInstance, "weight", value);
      }
    },
    density: {
      get: function(value) {
        return this.productInstance.weight / 1000;
      },
      set: function(value) {
        this.$set(this.productInstance, "density", value);
      }
    }
  },
  watch: {
    product(val) {
      this.productInstance = val;
      if (this.productInstance) {
        // inizialize date of today if exists the field
        if (!this.productInstance.date && this.checkFormFields("date")) {
          this.$set(this.productInstance, "date", this.$moment().format());
        }
        // inizialize productionDate of today if exists the field and is null
        if (
          !this.productInstance.productionDate &&
          this.checkFormFields("productionDate")
        ) {
          this.$set(
            this.productInstance,
            "productionDate",
            this.$moment().format()
          );
        }
        this.beginUpload = false;
        this.filesForUpload = [];
        this.filesForDelete = [];
      }
    },
    weight(val) {
      var d = val / 1000;
      if (this.productInstance && this.productInstance.weight)
        this.$set(this.productInstance, "density", d);
    },
    updateDone(val) {
      if (val) {
        this.$refs.form.resetValidation();
        this.setVisible(false);
      }
    },
    filesForUpload() {
      // Validation which checks that at least one file is uploaded befor submission
      if (this.updatedCount) {
        if (this.filesForUpload.length > 0) {
          this.uploadedFilesCount =
            this.uploadedFilesCount + this.filesForUpload.length;
        }
        // Vue triggers the filesForUpload method multiple times within a single update
        // The `upladedCount` variable is used to update the count only once
        this.updatedCount = false;
      }
      if (this.uploadedFilesCount > 0) {
        this.atLeastOneFile = true;
      } else {
        this.atLeastOneFile = false;
      }
    },
    uploadedFilesCount(val) {
      this.uploadedFilesCount = val;
    },
    qty(val) {
      this.minQuantity = val;
    }
  },
  methods: {
    fieldrules(field) {
      return Rules(this.userRole, this.fieldsValidation, this.minQuantity)[field]
    },
    filesFoundOnMount(count) {
      this.uploadedFilesCount = count;
      this.atLeastOneFile = true;
    },
    formvalidate() {
      this.submitted = true;
      if (this.userRole ==="seller") {
        this.atLeastOneFile =  this.fieldsValidation ? !this.uploadedFilesCount <= 0: true
        return this.$refs.form.validate() &&  !this.errorinForm && this.atLeastOneFile;
      } else {
        return this.$refs.form.validate() &&  !this.errorinForm
      }
      
    },
    resetValidation() {
      this.submitted = false;
      this.uploadedFilesCount = 0;
      this.atLeastOneFile = false;
      this.$refs.form.resetValidation();
    },
    deleteItem(loading) {
      this.uploadedFilesCount -= 1;
    },
    addItem() {
      this.updatedCount = true;
    },
    checkFormFields(value) {
       
      if (
        this.productInstance &&
        this.productInstance[this.userRole === "buyer" ? "buyerModel" : "model"]
      ) {
        if (this.viewMode) {
          return this.productInstance.product[
            this.productInstance.actionType === "buyer" ? "buyerModel" : "model"
          ].includes(value);
        } else {
          return this.productInstance[
            this.userRole === "buyer" ? "buyerModel" : "model"
          ].includes(value);
        }
      }
      return false;
    },
    closeWin(type) {
      this.productInstance = {}
      if (!this.beginUpload) {
        // Reset file validation on window close seperately
        this.updatedCount = false;
        this.submitted = false;
        this.atLeastOneFile = false;
        this.uploadedFilesCount = 0;
        this.error = false;
        // Reset general validation
        this.updateDone = true;
        this.$refs.form.resetValidation();
        if (!this.$store.state.product.productState && this.type !== "offer") {
          this.$store
            .dispatch("product/delete_productUploads")
            // .then(() => this.setVisible(false));
            .then(() => {
              return true;
            });
        } else {
          return true;
          // this.setVisible(false);
        }
      }
    },
    setProductField(field, value) {
      if (field == "date") {
        if (this.$moment(this.$moment().format()).isAfter(value, "day")) {
          this.$store.dispatch("setToast", {
            type: "error",
            message: "Available from cannot be in the past"
          });
          value = this.$moment().format();
        }
      }
      if (field == "productionDate") {
        if (this.$moment(this.$moment().format()).isAfter(value, "day")) {
          this.$store.dispatch("setToast", {
            type: "error",
            message: "production date cannot be in the past"
          });
          value = this.$moment().format();
        }
      }
      this.$set(this.productInstance, field, value);
    },
    fileAdded(files) {
      this.filesForUpload = files;
    },
    fileDeleted(file) {
      this.filesForDelete.push(file);
    },
    async deletedSelected() {
      var promises = [];
      this.filesForDelete.forEach(file => {
        promises.push(
          new Promise((resolve, reject) => {
            api.files
              .delete({
                container: `${this.product.id}@${this.$store.state.auth.user.id}`,
                file
              })
              .then(res => resolve(true))
              .catch(err => reject());
          })
        );
      });
      return await Promise.all(promises);
    },
    getModel(obj, field) {
      var target = obj.filter(val => {
        return val ? val.field == field : false;
      })[0];
      return target;
    },
    getCustomValues(obj, field) {
      var target = obj.filter(val => {
        return val.field == field;
      })[0];
      return target.customValues;
    }
  }
};
</script>
<style>
::-webkit-scrollbar {
  width: 5px;
}

</style>
