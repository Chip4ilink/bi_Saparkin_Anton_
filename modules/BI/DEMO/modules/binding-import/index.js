/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 26:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const mdt_client_1 = __webpack_require__(305);
const BindingImportListExtender_1 = __webpack_require__(871);
const BindingUploadCtrl_1 = __webpack_require__(953);
(0, mdt_client_1.registerModule)(() => {
    mdt_client_1.legacy.ListServiceInstance.ext(BindingImportListExtender_1.BindingImportListExtender);
    mdt_client_1.FormService.registerControl({
        code: "bind:FileLoad",
        title: "bind:FileLoad",
        enabled: () => false,
        type: BindingUploadCtrl_1.BindingUploadCtrl
    });
    appendSettingsFormByAliasForm();
}, {
    name: "binding-import"
});
function appendSettingsFormByAliasForm() {
    const formService = mdt_client_1.legacy.FormServiceInstance;
    formService.events.init.push((form) => {
        if (form.table.code !== "bind.Settings")
            return;
        form.events.layout.begin.push((layout) => {
            if (!form.getContext("isAliasAdded")) {
                const lb = new mdt_client_1.legacy.LayoutBuilder(layout);
                lb.addField("ID_Alias", {
                    control: "form"
                }, 12);
                form.setContext("isAliasAdded", true);
            }
        });
    });
    formService.events.init.push((form) => {
        var _a;
        if (form.table.code !== "bind.Alias")
            return;
        if (((_a = form.options.parent) === null || _a === void 0 ? void 0 : _a.table.code) !== "bind.Settings") {
            form.options.readonly = true;
            return;
        }
        const settingsForm = form.options.parent;
        const fieldParts = ["Target", "Source", "Dimension"];
        form.events.layout.begin.push((layout) => {
            fieldParts.forEach((fieldPart) => {
                const field = mdt_client_1.legacy.LayoutBuilder.findField(layout, "ID_mdt_ObjectField" + fieldPart);
                const settingsFieldValue = () => settingsForm.value("ID_Object" + fieldPart);
                field.options.filter$ = () => mdt_client_1.Filter.eq("ID_Object", settingsFieldValue());
                field.options.readonly$ = () => (settingsFieldValue() ? false : true);
            });
        });
        settingsForm.events.updated.push((f, v) => {
            var updatedFieldPart = fieldParts.find((i) => f.code.endsWith(i));
            if (updatedFieldPart) {
                form.forceEvaluate();
                if (!v) {
                    form.value("ID_mdt_ObjectField" + updatedFieldPart, null);
                }
            }
        });
    });
}


/***/ }),

/***/ 119:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BindingFileRequest = void 0;
class BindingFileRequest {
    constructor(FileGuid, date, TableCode) {
        this.FileGuid = FileGuid;
        this.TableCode = TableCode;
        this.Date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    }
}
exports.BindingFileRequest = BindingFileRequest;


/***/ }),

/***/ 152:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.importFromExcel = importFromExcel;
const BindingFileRequest_1 = __webpack_require__(119);
const BindingFileManager_1 = __webpack_require__(513);
const mdt_client_1 = __webpack_require__(305);
function importFromExcel(list, settingsRecord) {
    const settingsTable = mdt_client_1.legacy.SchemaManagerInstance._table(settingsRecord.ID_ObjectBinding);
    const isHistoricalBinding = settingsRecord.FlagHistoryBinding;
    const buttonEnabled = () => formCtrl.value("DateBegin") && formCtrl.getContext("fileUID");
    const instructionsCode = `binding-import.Instructions.${settingsTable.code}`;
    const instructionsContent = mdt_client_1.Utils.getText(instructionsCode);
    const isInstructionsVisible = instructionsContent !== instructionsCode;
    let formCtrl;
    const onExecute = () => {
        const fileUID = formCtrl.getContext("fileUID");
        const date = formCtrl.record().DateBegin;
        const tableCode = settingsTable.code;
        const req = new BindingFileRequest_1.BindingFileRequest(fileUID, date, tableCode);
        return BindingFileManager_1.BindingFileManager.uploadBindings(req);
    };
    const onError = () => {
        list.refresh();
    };
    const onSuccess = () => {
        list.refresh();
    };
    let onSave = (r) => {
        onExecute().then((response) => {
            onSuccess();
        }, (error) => {
            onError();
        });
    };
    let layout = {
        rows: [
            {
                cols: [
                    {
                        width: 12,
                        options: {
                            content: instructionsContent,
                            visible: isInstructionsVisible
                        },
                        type: "markdown"
                    },
                    {
                        width: 6,
                        type: "field",
                        options: {
                            field: "DateBegin",
                            visible: isHistoricalBinding
                        }
                    },
                    {
                        width: 6,
                        type: "bind:FileLoad",
                        options: {
                            field: "File"
                        }
                    }
                ]
            }
        ]
    };
    const table = {
        code: "bind.Import",
        title: "Import",
        fields: [
            {
                type: "date",
                code: "DateBegin",
                title: mdt_client_1.Utils.getText("Date start"),
                defaultValue: new Date()
            }
        ],
        $datasource: {
            fetch: () => { },
            save: (record) => {
                const result = onSave(record);
                if (mdt_client_1.legacy.utils.isPromisable(result))
                    return result;
                return Promise.resolve(record);
            }
        }
    };
    const preparedTable = mdt_client_1.legacy.SchemaManagerInstance.prepare(table);
    const record = { $table: preparedTable };
    formCtrl = new mdt_client_1.legacy.FormCtrl(preparedTable, null, {
        hideSubtitle: true,
        layout,
        record,
        primaryButton: {
            code: "bind.Import",
            title: "fileInputCtrl:upload",
            type: "primary",
            icon: "save",
            enabled: buttonEnabled
        }
    });
    mdt_client_1.Ui.showSidebar(formCtrl);
}


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

/***/ 495:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.exportToExcel = exportToExcel;
const mdt_client_1 = __webpack_require__(305);
function exportToExcel(listFacade, settingsRecord) {
    const api = mdt_client_1.legacy.ApiServiceInstance;
    const exportApi = new mdt_client_1.legacy.ExportApiAccessor(api);
    const list = listFacade.getListCtrl();
    const tablesIds = [
        settingsRecord.ID_ObjectDimension,
        settingsRecord.ID_ObjectSource,
        settingsRecord.ID_ObjectTarget
    ];
    let query = {
        select: [
            "ID_mdt_ObjectFieldSource/Code as SourceFieldCode",
            "ID_mdt_ObjectFieldSource/ID_Object/Code as SourceObjectCode",
            "ID_mdt_ObjectFieldTarget/Code as TargetFieldCode",
            "ID_mdt_ObjectFieldTarget/ID_Object/Code as TargetObjectCode",
            "ID_mdt_ObjectFieldDimension/Code as DimensionFieldCode",
            "ID_mdt_ObjectFieldDimension/ID_Object/Code as DimensionObjectCode"
        ],
        filter: mdt_client_1.Filter.eq("ID_Settings", settingsRecord.ID)
    };
    mdt_client_1.legacy.ApiServiceInstance.fetch(query, "bind.Alias").then((fetchResult) => {
        const fieldAliasesForBindingObjects = {};
        if (fetchResult.records.length != 0) {
            const record = fetchResult.records[0];
            if (record.TargetFieldCode) {
                fieldAliasesForBindingObjects[record.TargetObjectCode] = record.TargetFieldCode;
            }
            if (record.SourceFieldCode) {
                fieldAliasesForBindingObjects[record.SourceObjectCode] = record.SourceFieldCode;
            }
            if (record.DimensionFieldCode) {
                fieldAliasesForBindingObjects[record.DimensionObjectCode] = record.DimensionFieldCode;
            }
        }
        const fieldsToSelectParams = {};
        list.table.fields.forEach((x) => {
            var _a, _b;
            if (!x.refTable)
                return;
            const tableRef = (_a = x.refTable) !== null && _a !== void 0 ? _a : x.table;
            if (!tableRef)
                return;
            const tableId = tableRef.$id;
            if (!tablesIds.includes(tableId))
                return;
            var orderInFile = 0;
            switch (tableId) {
                case settingsRecord.ID_ObjectTarget:
                    orderInFile = 1;
                    break;
                case settingsRecord.ID_ObjectSource:
                    orderInFile = 2;
                    break;
                case settingsRecord.ID_ObjectDimension:
                    orderInFile = 3;
                    break;
            }
            fieldsToSelectParams[tableRef.code] = {
                foreignKeyField: x.code,
                foreignedTableField: (_b = fieldAliasesForBindingObjects[tableRef.code]) !== null && _b !== void 0 ? _b : "ID",
                foreignedTableFieldTitle: tableRef.title,
                orderInFile: orderInFile
            };
        });
        const columns = Object.entries(fieldsToSelectParams)
            .sort((a, b) => {
            if (a[1].orderInFile < b[1].orderInFile)
                return -1;
            else
                return 1;
        })
            .map(([_, record]) => {
            return `${record.foreignKeyField}/${record.foreignedTableField} as [${record.foreignedTableFieldTitle}(${record.foreignedTableField})]`;
        });
        const query = {
            select: columns,
            sorting: list.paging.sorting.list,
            filter: list.filterSet.get(),
            table: list.table,
            export: "excel",
            options: list.queryOptions()
        };
        exportApi.export(query, { method: "POST" });
    });
}


/***/ }),

/***/ 513:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BindingFileManager = void 0;
const mdt_client_1 = __webpack_require__(305);
class BindingFileManager {
    static uploadBindings(req) {
        return mdt_client_1.Api.request("binding/UploadBinding", req, { method: "POST" });
    }
}
exports.BindingFileManager = BindingFileManager;


/***/ }),

/***/ 523:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"name":"mdt-client","version":"31.3.3","description":"","main":"dist/index.js","types":"dist/index.d.ts","files":["/dist","/types"],"scripts":{"build":"tsc","types-update":"tsc --project tsconfig.facade-types.json","update":"tsc --project tsconfig.facade-types.json && tsc","pub-patch":"npm version patch && npm publish"},"repository":{"type":"git","url":"git@gitlab.ics-it.ru:mdtc/mdt-facade.git"},"author":"","license":"ISC","devDependencies":{"typescript":"^4.8.4"},"dependencies":{"@types/mithril":"^0.0.27"}}');

/***/ }),

/***/ 871:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BindingImportListExtender = void 0;
const mdt_client_1 = __webpack_require__(305);
const Importer_1 = __webpack_require__(152);
const Exporter_1 = __webpack_require__(495);
class BindingImportListExtender {
    constructor(list, options = {}) {
        this.list = list;
        this.options = options;
        this.api = mdt_client_1.legacy.ApiServiceInstance;
        const listFacade = new mdt_client_1.List(list);
        const currentTableId = list.table.id;
        let query = {
            filter: mdt_client_1.Filter.eq("ID_ObjectBinding", currentTableId),
            top: 1
        };
        this.api.fetch(query, "bind.Settings").then((r) => {
            if (r.records.length == 0)
                return;
            listFacade.addCommand({
                title: () => "Import",
                code: "binding-import",
                icon: "upload",
                execute: () => {
                    (0, Importer_1.importFromExcel)(listFacade, r.records[0]);
                }
            });
            listFacade.addCommand({
                title: () => "Export",
                code: "binding-export",
                icon: "download",
                execute: () => {
                    (0, Exporter_1.exportToExcel)(listFacade, r.records[0]);
                }
            });
        });
    }
}
exports.BindingImportListExtender = BindingImportListExtender;


/***/ }),

/***/ 953:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BindingUploadCtrl = void 0;
const mdt_client_1 = __webpack_require__(305);
class BindingUploadCtrl {
    constructor(parent) {
        this.parent = parent;
        this.$view = () => {
            const header = (0, mdt_client_1.m)(".field-view-label-wrap", (0, mdt_client_1.m)(".field-label-wrapper", (0, mdt_client_1.m)("label.field-label-view field-plain-label-view", (0, mdt_client_1.m)("span.field-label-view-title", mdt_client_1.Utils.getText("formControl:File")))));
            return (0, mdt_client_1.m)("div.form-group", [header, mdt_client_1.legacy.view(this.fileCtrl)]);
        };
        this.fileCtrl = new mdt_client_1.legacy.FileInputCtrl({
            uploadUrl: () => "file/upload",
            downloadUrl: () => null,
            value: () => this.fileName,
            clear: () => {
                parent.setContext("fileUID", null);
                this.fileName = null;
            },
            text: () => this.fileName,
            type: "default",
            uploaded: (r) => this.init(r)
        });
    }
    init(r = {}) {
        this.fileName = r.name;
        this.parent.setContext("fileUID", r.uid);
    }
}
exports.BindingUploadCtrl = BindingUploadCtrl;


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
__webpack_require__(26);

})();

/******/ })()
;
//# sourceMappingURL=index.js.map