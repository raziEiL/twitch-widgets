/* const PackEvent = 0;
const PackMpegts = 1; */
//export const PackType = Object.freeze({ PackEvent, PackMpegts });
export enum PackType {
    Event,
    Mpegts
}
/* const EventClose = 0; */
//export const EventType = Object.freeze({ EventClose });

export enum EventType {
    Close
}

export interface Options {
    packType: PackType;
    type?: EventType;
    data: number;
    concatBuffer?: Buffer | Uint8Array;
}

/**
 * Create Buffer 'package' with size 3 bytes. 1 byte = PackType, 2 byte = options.type, 3 byte = options.data, other remaining bytes options.concatBuffer bytes
 */
export function packBuffer(options: Options) {
    const buff = Buffer.alloc(3);
    buff.writeInt8(options.packType);
    buff.writeInt8(options.data, 2);

    switch (options.packType) {
        case PackType.Event: {
            if (options.type)
                buff.writeInt8(options.type, 1);
            if (options.concatBuffer)
                return Buffer.concat([buff, options.concatBuffer]);
            break;
        }
        case PackType.Mpegts: {
            break;
        }
    }

    return buff;
}

export function packConcat(packBf: Buffer, buffer: Buffer) {
    return Buffer.concat([packBf, buffer]);
}

/**
 * Unpack buffer to Options Object. {packType: number, type: number, data: number, concatBuffer: Buffer}
 */
export function unpackBuffer(buffer: Buffer): Options {
    const unit8 = new Uint8Array(buffer);
    return {
        packType: Buffer.from(unit8).readInt8(),
        type: Buffer.from(unit8).readInt8(1),
        data: Buffer.from(unit8).readInt8(2),
        concatBuffer: unit8.slice(3),
    };
}
/* console.log(bufferPack(PackType.PackEvent, { data: 1, type: EventType.EventClose, concatBuffer: Buffer.from("1") }));
console.log(bufferPack(PackType.PackEvent, { data: 1, type: EventType.EventClose }));
console.log(bufferPack(PackType.PackMpegts, { data: 12 })); */

/* const test = packBuffer(PackType.PackEvent, { data: 1, type: EventType.EventClose, concatBuffer: Buffer.from("1") });
console.log(test);
console.log(unpackBuffer(test)); */
