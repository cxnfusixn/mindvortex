import fs from 'node:fs/promises';
import {reelTemplate} from './lib/reel-template.mjs';
import {renderReel} from './lib/reel-render.mjs';
import {addAmbient} from './lib/reel-audio.mjs';
const [command,...args]=process.argv.slice(2);
if(command==='template')console.log(JSON.stringify(reelTemplate,null,2));
else if(command==='render')console.log(await renderReel({...JSON.parse(await fs.readFile(args[0],'utf8')),ffmpeg:process.env.FFMPEG_PATH||'ffmpeg'}));
else if(command==='audio')console.log(await addAmbient({input:args[0],output:args[1],ffmpeg:process.env.FFMPEG_PATH||'ffmpeg'}));
else throw Error('Usage: node reel-cli.mjs template | render manifest.json | audio input.mp4 output.mp4');
