import pathlib,shutil,subprocess
root=pathlib.Path('/opt/mindvortex-social/releases').resolve()
keep={pathlib.Path('/opt/mindvortex-social/current').resolve()}
pid=subprocess.check_output(['systemctl','show','-p','MainPID','--value','mindvortex-social-worker'],text=True).strip()
keep.add(pathlib.Path('/proc/'+pid+'/cwd').resolve())
folders=sorted([p for p in root.iterdir() if p.is_dir() and p.name.isdigit()],reverse=True)
keep.update(folders[:4])
for p in folders:
 resolved=p.resolve()
 if resolved.parent !=root or resolved in keep:continue
 shutil.rmtree(resolved)
 print('Removed old build:',p.name)
