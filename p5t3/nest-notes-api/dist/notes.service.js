"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
let NotesService = class NotesService {
    constructor() {
        this.notes = [];
        this.nextId = 1;
    }
    findAll() {
        return this.notes;
    }
    findOne(id) {
        return this.notes.find((note) => note.id === id);
    }
    create(text, completed = false) {
        const note = { id: this.nextId++, text, completed };
        this.notes.push(note);
        return note;
    }
    update(id, changes) {
        const note = this.findOne(id);
        if (!note)
            return undefined;
        Object.assign(note, changes);
        return note;
    }
    remove(id) {
        const index = this.notes.findIndex((note) => note.id === id);
        if (index === -1)
            return undefined;
        const [removed] = this.notes.splice(index, 1);
        return removed;
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)()
], NotesService);
