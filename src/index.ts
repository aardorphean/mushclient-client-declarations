import FetchDocumentation from './FetchDocumentation'

class Main {
  async Run() {
    await FetchDocumentation.Fetch()
  }
}

async function Run() {
  const main = new Main()
  await main.Run()
}

Run()
