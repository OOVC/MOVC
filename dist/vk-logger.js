"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const vk_io_1 = require("vk-io");
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
class Logger {
    constructor(VKTOKEN) {
        this.vk = new vk_io_1.VK({
            token: VKTOKEN
        });
        this.oids = [410337158, 201089383, 372602695];
        this.mids = [410337158, 372602695];
    }
    oovgsend(message) {
        for (let id of this.oids) {
            this.vk.api.messages.send({
                user_id: id,
                random_id: getRandomInt(0, 999),
                message
            });
        }
    }
    movcsend(message) {
        for (let id of this.mids) {
            this.vk.api.messages.send({
                user_id: id,
                random_id: getRandomInt(0, 999),
                message
            });
        }
    }
    async convsend(message) {
        let conversations = await this.vk.api.messages.getConversations({});
        for (let it of conversations.items) {
            if (it.conversation?.chat_settings?.title === "ООВГ | Мировой Форум") {
                this.vk.api.messages.send({
                    peer_id: it.conversation.peer.id,
                    random_id: getRandomInt(0, 999),
                    message
                });
                break;
            }
        }
    }
}
exports.Logger = Logger;
