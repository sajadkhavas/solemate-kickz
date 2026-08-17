type MaterialIndex = 0 | 1 | 2;

type BoxPart = {
  center: [number, number, number];
  size: [number, number, number];
  material: MaterialIndex;
};

const PARTS: BoxPart[] = [
  { center: [0, 0, 0], size: [1.75, 0.28, 4.3], material: 1 },
  { center: [0, 0.22, 0.05], size: [1.62, 0.22, 4], material: 0 },
  { center: [0, 0.52, 1.28], size: [1.48, 0.45, 1.35], material: 0 },
  { center: [0, 0.72, 0.15], size: [1.38, 0.72, 1.95], material: 0 },
  { center: [0, 0.9, -1.35], size: [1.35, 1.05, 0.95], material: 1 },
  { center: [0, 1.18, -0.05], size: [0.7, 0.95, 0.18], material: 1 },
  { center: [0.72, 0.75, 0.15], size: [0.07, 0.24, 1.75], material: 2 },
  { center: [-0.72, 0.75, 0.15], size: [0.07, 0.24, 1.75], material: 2 },
  { center: [0, -0.16, 1.55], size: [1.6, 0.08, 0.85], material: 2 },
];

const FACE_DEFINITIONS = [
  {
    normal: [1, 0, 0],
    corners: [
      [1, -1, -1],
      [1, -1, 1],
      [1, 1, 1],
      [1, 1, -1],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [-1, -1, 1],
      [-1, -1, -1],
      [-1, 1, -1],
      [-1, 1, 1],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: [
      [-1, 1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  },
  {
    normal: [0, -1, 0],
    corners: [
      [-1, -1, 1],
      [1, -1, 1],
      [1, -1, -1],
      [-1, -1, -1],
    ],
  },
  {
    normal: [0, 0, 1],
    corners: [
      [1, -1, 1],
      [-1, -1, 1],
      [-1, 1, 1],
      [1, 1, 1],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
    ],
  },
] as const;

function align4(value: number) {
  return (value + 3) & ~3;
}

function boxGeometry(part: BoxPart) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const [cx, cy, cz] = part.center;
  const [sx, sy, sz] = part.size.map((value) => value / 2) as [number, number, number];

  for (const face of FACE_DEFINITIONS) {
    const base = positions.length / 3;
    for (const [x, y, z] of face.corners) {
      positions.push(cx + x * sx, cy + y * sy, cz + z * sz);
      normals.push(...face.normal);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    min: [cx - sx, cy - sy, cz - sz],
    max: [cx + sx, cy + sy, cz + sz],
  };
}

function bytes(view: ArrayBufferView) {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

function appendChunk(chunks: Uint8Array[], source: Uint8Array, offset: number) {
  const aligned = align4(offset);
  if (aligned > offset) chunks.push(new Uint8Array(aligned - offset));
  chunks.push(source);
  return { byteOffset: aligned, nextOffset: aligned + source.byteLength };
}

export function createShoeModelBlob() {
  const chunks: Uint8Array[] = [];
  const bufferViews: Array<Record<string, number>> = [];
  const accessors: Array<Record<string, unknown>> = [];
  const primitives: Array<Record<string, unknown>> = [];
  let offset = 0;

  for (const part of PARTS) {
    const geometry = boxGeometry(part);

    const positionChunk = appendChunk(chunks, bytes(geometry.positions), offset);
    offset = positionChunk.nextOffset;
    const positionView =
      bufferViews.push({
        buffer: 0,
        byteOffset: positionChunk.byteOffset,
        byteLength: geometry.positions.byteLength,
        target: 34962,
      }) - 1;
    const positionAccessor =
      accessors.push({
        bufferView: positionView,
        componentType: 5126,
        count: geometry.positions.length / 3,
        type: "VEC3",
        min: geometry.min,
        max: geometry.max,
      }) - 1;

    const normalChunk = appendChunk(chunks, bytes(geometry.normals), offset);
    offset = normalChunk.nextOffset;
    const normalView =
      bufferViews.push({
        buffer: 0,
        byteOffset: normalChunk.byteOffset,
        byteLength: geometry.normals.byteLength,
        target: 34962,
      }) - 1;
    const normalAccessor =
      accessors.push({
        bufferView: normalView,
        componentType: 5126,
        count: geometry.normals.length / 3,
        type: "VEC3",
      }) - 1;

    const indexChunk = appendChunk(chunks, bytes(geometry.indices), offset);
    offset = indexChunk.nextOffset;
    const indexView =
      bufferViews.push({
        buffer: 0,
        byteOffset: indexChunk.byteOffset,
        byteLength: geometry.indices.byteLength,
        target: 34963,
      }) - 1;
    const indexAccessor =
      accessors.push({
        bufferView: indexView,
        componentType: 5123,
        count: geometry.indices.length,
        type: "SCALAR",
        min: [0],
        max: [23],
      }) - 1;

    primitives.push({
      attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
      indices: indexAccessor,
      material: part.material,
    });
  }

  const binaryLength = align4(offset);
  if (binaryLength > offset) chunks.push(new Uint8Array(binaryLength - offset));
  const binary = new Uint8Array(binaryLength);
  let cursor = 0;
  for (const chunk of chunks) {
    cursor = align4(cursor);
    binary.set(chunk, cursor);
    cursor += chunk.byteLength;
  }

  const gltf = {
    asset: { version: "2.0", generator: "SOLE F10 procedural sneaker" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ name: "SOLE Lightweight Sneaker", primitives }],
    materials: [
      {
        name: "Upper",
        pbrMetallicRoughness: {
          baseColorFactor: [0.84, 0.84, 0.84, 1],
          metallicFactor: 0.05,
          roughnessFactor: 0.72,
        },
      },
      {
        name: "Dark",
        pbrMetallicRoughness: {
          baseColorFactor: [0.035, 0.035, 0.035, 1],
          metallicFactor: 0.1,
          roughnessFactor: 0.62,
        },
      },
      {
        name: "SOLE Lime",
        pbrMetallicRoughness: {
          baseColorFactor: [0.58, 0.88, 0.09, 1],
          metallicFactor: 0,
          roughnessFactor: 0.45,
        },
      },
    ],
    buffers: [{ byteLength: binary.byteLength }],
    bufferViews,
    accessors,
  };

  const encoder = new TextEncoder();
  const jsonSource = JSON.stringify(gltf);
  const jsonLength = align4(encoder.encode(jsonSource).byteLength);
  const json = new Uint8Array(jsonLength);
  json.fill(0x20);
  json.set(encoder.encode(jsonSource));

  const totalLength = 12 + 8 + json.byteLength + 8 + binary.byteLength;
  const output = new Uint8Array(totalLength);
  const data = new DataView(output.buffer);
  data.setUint32(0, 0x46546c67, true);
  data.setUint32(4, 2, true);
  data.setUint32(8, totalLength, true);
  data.setUint32(12, json.byteLength, true);
  data.setUint32(16, 0x4e4f534a, true);
  output.set(json, 20);
  const binaryHeader = 20 + json.byteLength;
  data.setUint32(binaryHeader, binary.byteLength, true);
  data.setUint32(binaryHeader + 4, 0x004e4942, true);
  output.set(binary, binaryHeader + 8);

  return new Blob([output], { type: "model/gltf-binary" });
}
