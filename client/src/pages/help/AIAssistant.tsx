import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpLayout } from "@/components/HelpLayout";

export default function AIAssistant() {
  return (
    <HelpLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI Script Assistant</h2>
          <p className="text-muted-foreground">
            Generate Lua automation scripts using natural language descriptions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              The AI Script Assistant requires your own OpenAI API key. 
              Mudscape does not provide API access - you need to bring your own key.
            </p>
            <h4 className="font-semibold mt-4">Setting Up</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Get an API key from <a href="https://platform.openai.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">OpenAI's platform</a></li>
              <li>Go to Settings in Mudscape</li>
              <li>Navigate to the AI tab</li>
              <li>Enter your API key</li>
              <li>Choose a storage method</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Key Storage Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Local Storage (Unencrypted)</h4>
              <p className="text-sm text-muted-foreground">
                Your API key is stored in the browser's local storage. 
                Convenient but less secure.
              </p>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Password-Encrypted</h4>
              <p className="text-sm text-muted-foreground">
                Your API key is encrypted with AES-GCM using a password you provide. 
                You'll need to unlock it each session with your password.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Using the Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Click the wand icon in the Play screen toolbar to open the Script Assistant.
            </p>
            <h4 className="font-semibold mt-4">How It Works</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Describe what you want in plain language</li>
              <li>The AI generates a complete Lua script</li>
              <li>Review the generated code</li>
              <li>Click to add it as a trigger, alias, timer, or button</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Trigger:</h4>
              <p className="text-sm bg-muted p-2 rounded">
                "Create a trigger that automatically casts heal on myself when my HP drops below 50"
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Alias:</h4>
              <p className="text-sm bg-muted p-2 rounded">
                "Make an alias 'ga' that casts greater armor on myself"
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Timer:</h4>
              <p className="text-sm bg-muted p-2 rounded">
                "Add a timer that sends 'look' every 30 seconds to prevent being idle-kicked"
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Complex automation:</h4>
              <p className="text-sm bg-muted p-2 rounded">
                "Create a trigger that plays the 'levelup' sound and echoes 'Congratulations!' when I see 'You have gained a level'"
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Be specific about the pattern you want to match</li>
              <li>Describe the exact action you want to take</li>
              <li>Mention if you want sound effects or echo messages</li>
              <li>Include any conditions (e.g., "only if HP is below 50")</li>
              <li>Review and test the generated code before relying on it</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional Feature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              The AI Script Assistant is completely optional. Experienced users 
              can write Lua scripts directly without using the AI.
            </p>
            <p className="text-sm text-muted-foreground">
              If you're comfortable with Lua, you might find it faster to write 
              scripts manually using the Lua Scripting documentation.
            </p>
          </CardContent>
        </Card>
      </div>
    </HelpLayout>
  );
}
