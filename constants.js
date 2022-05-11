/*
.- QOI_OP_INDEX ---------.
|         Byte[0]        |
| 7  6  5  4  3  2  1  0 |
|------+-----------------|
| 0  0 |     index       |
`------+-----------------`

2-bit tag b00
6-bit index into the color index array: 0..63

Valid encoder must not issue 2 or more consecutive QOI_OP_INDEX
chunks to the same index. Use QOI_OP_RUN instead.
*/
const QOI_OP_INDEX = 0x00; // 00xxxxxx

/*
.- QOI_OP_DIFF ----------.
|         Byte[0]        |
| 7  6  5  4  3  2  1  0 |
|------+-----+-----+-----|
| 0  1 | dr  | dg  | db  |
`------+-----+-----+-----`

2-bit tag b01
2-bit   red channel difference from previous pixel -2..1
2-bit green channel difference from previous pixel -2..1
2-bit  blue channel difference from previous pixel -2..1

Difference to current channel values are using wraparound
operation, so 1 - 2 will result in 255, while 255 + 1
will result in 0.

Values are stored as unsigned integers with a bias of 2.
E.g. -2 is stored as 0 (b00). 1 is stored as 3 (b11).

The alpha value remains unchanged from the previous pixel.
*/
const QOI_OP_DIFF = 0x40;  // 01xxxxxx

/*
.- QOI_OP_LUMA ----------+------------------------.
|         Byte[0]        |         Byte[0]        |
| 7  6  5  4  3  2  1  0 | 7  6  5  4  3  2  1  0 |
|------+-----------------|------------+-----------|
| 1  0 |   diff green    |  dr - dg   |  db - dg  |
`------+-----------------+------------+-----------`

2-bit tag b10
6-bit green channel difference from previous pixel -32..31
4-bit   red channel difference minus green channel difference -8..7
4-bit  blue channel difference minus green channel difference -8..7

Green channel is used to indicate general direction of change and is
encoded in 6 bits. The red and blue channels (dr and db) base their
diffs off of the green channel difference.

I.e.:
  dr_dg = (curr_px.r - prev_px.r) - (curr_px.g - prev_px.g)
  db_dg = (curr_px.b - prev_px.b) - (curr_px.g - prev_px.g)

The difference to the current channel values are using a wraparound
operation, so 10 - 13 will result in 253, while 250 + 7 will result in 1.

Values are stored as unsigned integers with a bias of 32 for the
green channel and a bias of 8 for the red and blue channel.

The alpha value remains unchanged from the previous pixel.
*/
const QOI_OP_LUMA = 0x80;  // 10xxxxxx

/*
.- QOI_OP_RUN -----------.
|         Byte[0]        |
| 7  6  5  4  3  2  1  0 |
|------+-----------------|
| 1  1 |       run       |
`------+-----------------`

2-bit tag b11
6-bit run-length repeating the previous pixel 1..62

The run-length is stored with a bias of -1. Note that the run-lengths
63 and 63 (b111110 and b111111) are illegal as they are occupied by
the QOI_OP_RGB and QOI_OP_RGBA tags.
*/
const QOI_OP_RUN = 0xc0;   // 11xxxxxx

/*
.- QOI_OP_RGB -----------+---------+---------+---------.
|         Byte[0]        | Byte[1] | Byte[2] | Byte[3] |
| 7  6  5  4  3  2  1  0 | 7 .. 0  | 7 .. 0  | 7 .. 0  |
|------------------------|---------+---------+---------|
| 1  1  1  1  1  1  1  0 |   red   |  green  |  blue   |
`------------------------+---------+---------+---------`

8-bit tag b11111110
8-bit   red channel value
8-bit green channel value
8-bit  blue channel value

The alpha value remains unchanged from the previous pixel.
*/
const QOI_OP_RGB = 0xfe;   // 11111110

/*
.- QOI_OP_RGBA ----------+---------+---------+---------+---------.
|         Byte[0]        | Byte[1] | Byte[2] | Byte[3] | Byte[4] |
| 7  6  5  4  3  2  1  0 | 7 .. 0  | 7 .. 0  | 7 .. 0  | 7 .. 0  |
|------------------------|---------+---------+---------+---------|
| 1  1  1  1  1  1  1  0 |   red   |  green  |  blue   |  alpha  |
`------------------------+---------+---------+---------+---------`

8-bit tag b11111111
8-bit   red channel value
8-bit green channel value
8-bit  blue channel value
8-bit alpha channel value
*/
const QOI_OP_RGBA = 0xff;  // 11111111

const MAX_INT32 = 2 ** 32;
const QOI_SRGB = 0;
const QOI_LINEAR = 1;
const QOI_CHANNEL_RGB = 3;
const QOI_CHANNEL_RGBA = 4;
const QOI_MASK = 0b10000000;

const QOI_MAGIC_Q = 0x71;
const QOI_MAGIC_O = 0x6f;
const QOI_MAGIC_I = 0x69;
const QOI_MAGIC_F = 0x66;

module.exports = {
  QOI_MAGIC_Q,
  QOI_MAGIC_O,
  QOI_MAGIC_I,
  QOI_MAGIC_F,
  QOI_OP_INDEX,
  QOI_OP_DIFF,
  QOI_OP_LUMA,
  QOI_OP_RUN,
  QOI_OP_RGB,
  QOI_OP_RGBA,
  QOI_SRGB,
  QOI_LINEAR,
  QOI_CHANNEL_RGB,
  QOI_CHANNEL_RGBA,
  QOI_MASK,
  MAX_INT32,
};