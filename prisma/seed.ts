import { PrismaClient } from '@prisma/client';
import { users } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  for(let user of users){
    const {hash, ...rest} = user;
    await prisma.user.create({ data: {...rest, credentials: { create: { hash }}}})
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
