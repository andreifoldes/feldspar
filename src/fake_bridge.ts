import { CommandSystem, CommandSystemDonate, CommandSystemExit, isCommandSystemDonate, isCommandSystemExit } from './framework/types/commands';
import { Bridge } from './framework/types/modules';
import { supabase } from './utils/supabase';

interface DataItem {
  id: string;
  title: {
    en: string;
    nl: string;
  };
  data_frame: any;
}

export default class FakeBridge implements Bridge {
  send(command: CommandSystem): void {
    if (isCommandSystemDonate(command)) {
      this.handleDonation(command);
    } else if (isCommandSystemExit(command)) {
      this.handleExit(command);
    } else {
      console.log('[FakeBridge] received unknown command: ' + JSON.stringify(command));
    }
  }

  async handleDonation(command: CommandSystemDonate): Promise<void> {
    try {
      const data = JSON.parse(command.json_string);
      
      // Only save TikTok data, not tracking messages
      if (!command.key.endsWith('-TikTok')) {
        console.log('[FakeBridge] Skipping tracking message:', command.key);
        return;
      }

      console.log('[FakeBridge] Processing TikTok data:', {
        key: command.key,
        tableName: 'uploads',
        insertData: {
          json_data: data,
          filename: `${command.key}.json`
        }
      });

      // Find the metadata section that contains the original filename
      const metadata = data.find((item: DataItem) => item.id === 'metadata');
      console.log('[FakeBridge] Full data structure:', JSON.stringify(data, null, 2));
      console.log('[FakeBridge] Metadata object:', JSON.stringify(metadata, null, 2));
      
      // Get filename from the DataFrame's split format
      const originalFilename = metadata?.data_frame?.columns?.includes('original_filename') 
        ? metadata.data_frame.data[0][metadata.data_frame.columns.indexOf('original_filename')]
        : 'unknown.json';
      console.log('[FakeBridge] Extracted filename:', originalFilename);

      // Insert into Supabase with detailed error handling
      const { data: insertedData, error } = await supabase
        .from('uploads')
        .insert({
          json_data: data.filter((item: DataItem) => item.id !== 'metadata'),  // Remove metadata from stored data
          filename: originalFilename,
          // created_at will be automatically set by Supabase
        });

      if (error) {
        throw error;
      }

      console.log('[FakeBridge] Data saved successfully to Supabase:', insertedData);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[FakeBridge] Error saving to Supabase:', {
        message: err.message,
        key: command.key,
        timestamp: new Date().toISOString()
      });
      console.error('Please check:');
      console.error('1. Supabase connection (see previous logs)');
      console.error('2. Database permissions for the uploads table');
      console.error('3. Valid JSON data structure');
    }
  }

  handleExit(command: CommandSystemExit): void {
    console.log(`[FakeBridge] received exit: ${command.code}=${command.info}`);
  }
}
