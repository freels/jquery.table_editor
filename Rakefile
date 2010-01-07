FRAGMENT_LIST = %w(preamble table_editor util cellinput filter cellinfo cellnav postamble)

task :build do
  mkdir_p 'build'
  
  File.open 'build/jquery.table_editor.js', 'w' do |f|
    FRAGMENT_LIST.each do |fragment|
      f << File.read("src/#{fragment}.js") << "\n"
    end
  end
  
end
