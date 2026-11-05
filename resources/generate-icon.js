/**
 * Generador de icono para OrbitMenu en formato PNG válido
 */
const fs = require('fs');
const path = require('path');

// Icono PNG 32x32 RGBA estilizado en Base64
// Representa un orbe orbital con gradiente cian y anillo exterior
const iconPngBase64 = 
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwY' +
  'AAAAB3RJTUUH6AsFBzc2dKzE/wAAA2JJREFUWMOtl91rU1cUxX/75pY2pG2S1lSbhjT50UeLCoLgVvugFSp9EF9EEcQHweLH' +
  '/gH9C6J9EnxQH1Rw3/qgCK4Pgn3wQR+qKCpdB9rYpE2bm9zbfe9eH869uTk3557ctLq12Xf2Xmvv3+qssxewgX/2y2Qy' +
  'GffqY2+e9H3vSblcrnvv8X3f831/1ff9hu/7dd/36/F4vM7/g4+XvV2+v7l+9U/v3v49Nze3sLS0VJybm1tZWVmp+L7v' +
  'eZ5X9X2/6Pv+d4yxl4qi3Nva2lrZ2NjYSyaTjcv9O9Z/9erVb5eWlv7wPG82m83O27bdzWaze3t7e/W1tbWlpaWl2bW1' +
  'tdVYLHY8Go3+cOzYsf69e/eeP5fJZNq2bX/red4PnufNuK6b6+rq6m1ubm4kEolkPB4fj8fjD8Lh8D3bto8lk8nU8fHx' +
  'd4FAoGv3zszMvO267l2v1/u5q6urU1NTU8vlcrmlpSUrEon8FA6HH4ZCob6enp6xQCBwNxgM1tYvLS299zyvHQ6HR13X' +
  'fcQYe6koSt/m5ubfPp/PTiQSf8Tj8Z9isVj/8PDwqZ6entFgMHizvX7lypUfnuf9pmnaz/F4/HjIdwghzmAweMLv95/2' +
  '+Xx3TNP80nXdH13X/WZtbe197L9h3+/fv/+bEKKjq6vrx4MGDz1dXV1jmqYN+v3+386dO/fg39vFxcXfGWM/RSKR49eu' +
  'XTv29x+v5/H48ePfNzY2fnRd9zshhB7yH2N8rGnal4qi/Hjw+hMvP64oSl+tVnvj8Xg6hBB6uRjQNP5fRFEUvdls9reG' +
  'hkb/9uV2dnYeuK77vcvlyeFwiFAohBCCQqFAPp8nHA6jaRoDAwN0d3ejqiqapqFpGufPn2doaIh4PI6maaiqiq7raJqG' +
  'rutks1nm5+cJBoMoisLS0hKGYTAyMkIoFCIYDFIqlbAsiz179qAoCiMjI6TTaSYmJvA8j3Q6ja7rGIbB2NgYiqLw7Nk/' +
  '1Ov1r3t7e88FAoH/Xv5XmKaZc113e61QKOzquk4ul0NRFOx2/f5zZ2dnx3Xd777vX7quO97T0/O2ZVm3LMs66Xle3bKs' +
  'X57ntW80TXunadp3mqYd7O/v/zWTyfzf5/PddBxnwnXdw73L6/W67rrudcMwHhqG8dB13X9d1808ePCA7e1t3G737Vqt' +
  '9qZSqbxdXV1d2Nra2tjd3f2/BwT/Aj/m/wE85172AAAAAElFTkSuQmCC';

const targetPath = path.join(__dirname, 'icon.png');
fs.writeFileSync(targetPath, Buffer.from(iconPngBase64, 'base64'));
console.log('[Icon] Icono generado en:', targetPath);
