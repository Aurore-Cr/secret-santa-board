import 'dotenv/config';
import { app } from './app.js';
import './db/database.js';
const port=Number(process.env.PORT || 3001);
app.listen(port,()=>console.log(`API Secret Santa : http://localhost:${port}`));
