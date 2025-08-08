/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 154:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UomFormExtender = void 0;
const Constants_1 = __webpack_require__(913);
const mdt_client_1 = __webpack_require__(305);
class UomFormExtender {
    static init(form) {
        var _a, _b, _c;
        if (form.getObject().getCode() == Constants_1.DbSchema.SKU_UOMBase) {
            form.setFieldOptions({
                Rates: {
                    formOptions: {
                        $context: {
                            uom: {
                                getBaseUom: () => form.valueByPath("ID_UOM/Name")
                            }
                        }
                    }
                }
            });
        }
        if (form.getObject().getCode() == Constants_1.DbSchema.SKU_UOMRates) {
            if (!((_c = (_b = (_a = form.getFormCtrl().options) === null || _a === void 0 ? void 0 : _a.$context) === null || _b === void 0 ? void 0 : _b.uom) === null || _c === void 0 ? void 0 : _c.getBaseUom))
                return;
            const getBaseUom = () => {
                return form.getFormCtrl().options.$context.uom.getBaseUom();
            };
            form.setFieldOptions({
                RecalculationRules: {
                    formOptions: {
                        events: {
                            init: [
                                (formCtrl) => {
                                    const recalcRuleForm = new mdt_client_1.Form(formCtrl);
                                    recalcRuleForm.setFieldOptions({
                                        Denom: {
                                            actions: [
                                                {
                                                    text: () => recalcRuleForm.valueByPath("ID_UOM_Target/Name"),
                                                    title: () => recalcRuleForm.valueByPath("ID_UOM_Target/Name")
                                                }
                                            ],
                                            showClearAction: false
                                        },
                                        Num: {
                                            actions: [
                                                {
                                                    text: getBaseUom,
                                                    title: getBaseUom
                                                }
                                            ],
                                            showClearAction: false
                                        }
                                    });
                                }
                            ]
                        }
                    }
                }
            });
        }
    }
}
exports.UomFormExtender = UomFormExtender;


/***/ }),

/***/ 305:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerModule = exports.legacy = exports.modules = exports.App = exports.Schema = exports.UiComponents = exports.ModuleRegistry = exports.RecordManager = exports.CommandManager = exports.Page = exports.Auth = exports.Filter = exports.m = exports.Api = exports.Ui = exports.Utils = exports.mUtils = exports.FieldControl = exports.ControlManager = exports.Form = exports.FormService = exports.List = exports.ListService = exports.SecurityManager = exports.Navigation = exports.MDT = void 0;
var package_json_1 = __importDefault(__webpack_require__(523));
exports.MDT = window.MDT;
exports.Navigation = exports.MDT.Navigation, exports.SecurityManager = exports.MDT.SecurityManager, exports.ListService = exports.MDT.ListService, exports.List = exports.MDT.List, exports.FormService = exports.MDT.FormService, exports.Form = exports.MDT.Form, exports.ControlManager = exports.MDT.ControlManager, exports.FieldControl = exports.MDT.FieldControl, exports.mUtils = exports.MDT.mUtils, exports.Utils = exports.MDT.Utils, exports.Ui = exports.MDT.Ui, exports.Api = exports.MDT.Api, exports.m = exports.MDT.m, exports.Filter = exports.MDT.Filter, exports.Auth = exports.MDT.Auth, exports.Page = exports.MDT.Page, exports.CommandManager = exports.MDT.CommandManager, exports.RecordManager = exports.MDT.RecordManager, exports.ModuleRegistry = exports.MDT.ModuleRegistry, exports.UiComponents = exports.MDT.UiComponents, exports.Schema = exports.MDT.Schema, exports.App = exports.MDT.App, exports.modules = exports.MDT.modules, exports.legacy = exports.MDT.legacy;
function registerModule(callback, context) {
    exports.MDT.registerModule(callback, {
        version: package_json_1.default.version,
        name: context === null || context === void 0 ? void 0 : context.name
    });
}
exports.registerModule = registerModule;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 429:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDeleteUomRatesCommand = void 0;
const Constants_1 = __webpack_require__(913);
function getDeleteUomRatesCommand() {
    return {
        title: Constants_1.Translation.UomRates.Delete,
        code: Constants_1.Translation.UomRates.Delete,
        icon: "trash",
        execute(list) {
            list.removeSelectedRows();
            list.refresh();
        }
    };
}
exports.getDeleteUomRatesCommand = getDeleteUomRatesCommand;


/***/ }),

/***/ 523:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"name":"mdt-client","version":"31.3.11","description":"","main":"dist/index.js","types":"dist/index.d.ts","files":["/dist","/types"],"scripts":{"build":"tsc","types-update":"tsc --project tsconfig.facade-types.json","update":"tsc --project tsconfig.facade-types.json && tsc","pub-patch":"npm version patch && npm publish"},"repository":{"type":"git","url":"git@gitlab.ics-it.ru:mdtc/mdt-facade.git"},"author":"","license":"ISC","devDependencies":{"typescript":"^4.8.4"},"dependencies":{"@types/mithril":"^0.0.27"}}');

/***/ }),

/***/ 619:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UomRatesListExtender = void 0;
const Constants_1 = __webpack_require__(913);
const UOMRates_1 = __webpack_require__(429);
class UomRatesListExtender {
    static init(list) {
        var objCode = list.getObject().getCode();
        if (objCode != Constants_1.DbSchema.SKU_UOMRates)
            return;
        const deleteUomRatesCmd = (0, UOMRates_1.getDeleteUomRatesCommand)();
        list.addCommand({
            title: deleteUomRatesCmd.title,
            icon: deleteUomRatesCmd.icon,
            order: -1,
            execute: () => deleteUomRatesCmd.execute(list),
            enabled: () => list.getSelectedRows().length > 0
        });
    }
}
exports.UomRatesListExtender = UomRatesListExtender;


/***/ }),

/***/ 913:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Translation = exports.DbSchema = void 0;
var DbSchema;
(function (DbSchema) {
    DbSchema["BillOfMaterial"] = "uom.BillOfMaterial";
    DbSchema["SKU_UOMRates"] = "uom.SKU_UOMRates";
    DbSchema["UnitOfMeasure_ext"] = "uom.UnitOfMeasure_ext";
    DbSchema["UnitOfMeasure"] = "uom.UnitOfMeasure";
    DbSchema["UOM_MetricRates"] = "uom.UOM_MetricRates";
    DbSchema["SKU_UOMBase"] = "uom.SKU_UOMBase";
    DbSchema["RecalculationRule"] = "uom.RecalculationRule";
})(DbSchema = exports.DbSchema || (exports.DbSchema = {}));
exports.Translation = {
    UomRates: {
        Delete: "uom:DeleteUomRates"
    }
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const mdt_client_1 = __webpack_require__(305);
const Constants_1 = __webpack_require__(913);
const UomRatesListExtender_1 = __webpack_require__(619);
const UomFormExtender_1 = __webpack_require__(154);
const listOptions = {
    merge: {
        hideCopy: true,
        hideMerge: true
    }
};
mdt_client_1.ListService.onCreate((list) => {
    if (!Object.values(Constants_1.DbSchema).includes(list.getObject().getCode()))
        return;
    list.setExtOptions(listOptions);
});
mdt_client_1.ListService.onCreate((list) => {
    UomRatesListExtender_1.UomRatesListExtender.init(list);
});
mdt_client_1.FormService.onCreate((form) => {
    UomFormExtender_1.UomFormExtender.init(form);
});
(0, mdt_client_1.registerModule)(() => { }, { name: "uom" });

})();

/******/ })()
;
//# sourceMappingURL=index.js.map