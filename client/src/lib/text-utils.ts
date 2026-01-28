const DECORATIVE_SYMBOLS = /[\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u2800-\u28FF\u2E80-\u2EFF\u3000-\u303F\uFF00-\uFFEF│─┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬▀▄█▌▐░▒▓■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯▰▱▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◄◅◆◇◈◉◊○◌◍◎●◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡◢◣◤◥◦◧◨◩◪◫◬◭◮◯★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☔☕☖☗☘☙☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯☰☱☲☳☴☵☶☷☸☹☺☻☼☽☾☿♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓♔♕♖♗♘♙♚♛♜♝♞♟♠♡♢♣♤♥♦♧♨♩♪♫♬♭♮♯♰♱♲♳♴♵♶♷♸♹♺♻♼♽♾♿⚀⚁⚂⚃⚄⚅⚆⚇⚈⚉⚊⚋⚌⚍⚎⚏⚐⚑⚒⚓⚔⚕⚖⚗⚘⚙⚚⚛⚜⚝⚞⚟⚠⚡⚢⚣⚤⚥⚦⚧⚨⚩⚪⚫⚬⚭⚮⚯⚰⚱⚲⚳⚴⚵⚶⚷⚸⚹⚺⚻⚼⚽⚾⚿⛀⛁⛂⛃]/g;

const REPEATED_PUNCTUATION = /([=\-_*#~.]{3,})/g;
const EXCESSIVE_SPACES = /  +/g;

export function stripSymbolsForScreenReader(text: string): string {
  let result = text;
  
  result = result.replace(DECORATIVE_SYMBOLS, ' ');
  result = result.replace(REPEATED_PUNCTUATION, ' ');
  result = result.replace(EXCESSIVE_SPACES, ' ');
  result = result.trim();
  
  return result;
}

export function parseKeyCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  
  let key = event.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();
  
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key);
  }
  
  return parts.join('+');
}

export function formatKeyCombo(combo: string): string {
  return combo
    .split('+')
    .map(part => {
      if (part === 'Ctrl') return 'Ctrl';
      if (part === 'Alt') return 'Alt';
      if (part === 'Shift') return 'Shift';
      if (part === 'Meta') return 'Cmd';
      return part;
    })
    .join(' + ');
}
