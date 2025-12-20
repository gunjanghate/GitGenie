import chalk from "chalk";
import didYouMean from "didyoumean";

export function handleUnknownCommand(program) {
  program.on("command:*", ([cmd]) => {
    const suggestions = program.commands.map(c => c.name());
    const match = didYouMean(cmd, suggestions);

    console.log(chalk.red(`❌ Unknown command: "${cmd}"`));

    if (match) {
      console.log(chalk.green(`👉 Did you mean: gg ${match}?`));
    }

    console.log(chalk.cyan(`Run "gg --help" to list all commands`));
    process.exit(1);
  });
}
